
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.31.0 */
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[32] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[34] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (314:36) 
    function create_if_block_7(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cell full orange svelte-1gmtuxg");
    			add_location(div, file, 314, 9, 6808);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(314:36) ",
    		ctx
    	});

    	return block;
    }

    // (312:36) 
    function create_if_block_6(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cell full blue svelte-1gmtuxg");
    			add_location(div, file, 312, 9, 6727);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(312:36) ",
    		ctx
    	});

    	return block;
    }

    // (310:36) 
    function create_if_block_5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cell full red svelte-1gmtuxg");
    			add_location(div, file, 310, 9, 6647);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(310:36) ",
    		ctx
    	});

    	return block;
    }

    // (308:36) 
    function create_if_block_4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cell full green svelte-1gmtuxg");
    			add_location(div, file, 308, 9, 6565);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(308:36) ",
    		ctx
    	});

    	return block;
    }

    // (306:36) 
    function create_if_block_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cell full purple svelte-1gmtuxg");
    			add_location(div, file, 306, 9, 6482);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(306:36) ",
    		ctx
    	});

    	return block;
    }

    // (304:36) 
    function create_if_block_2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cell full yellow svelte-1gmtuxg");
    			add_location(div, file, 304, 9, 6399);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(304:36) ",
    		ctx
    	});

    	return block;
    }

    // (302:8) {#if board[i][j] === 1}
    function create_if_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cell full cyan svelte-1gmtuxg");
    			add_location(div, file, 302, 9, 6318);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(302:8) {#if board[i][j] === 1}",
    		ctx
    	});

    	return block;
    }

    // (299:7) {#if board[i][j] === 0}
    function create_if_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cell empty  svelte-1gmtuxg");
    			add_location(div, file, 299, 8, 6230);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(299:7) {#if board[i][j] === 0}",
    		ctx
    	});

    	return block;
    }

    // (298:5) {#each row as cell , j}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*board*/ ctx[0][/*i*/ ctx[7]][/*j*/ ctx[8]] === 0) return create_if_block;
    		if (/*board*/ ctx[0][/*i*/ ctx[7]][/*j*/ ctx[8]] === 1) return create_if_block_1;
    		if (/*board*/ ctx[0][/*i*/ ctx[7]][/*j*/ ctx[8]] === 2) return create_if_block_2;
    		if (/*board*/ ctx[0][/*i*/ ctx[7]][/*j*/ ctx[8]] === 3) return create_if_block_3;
    		if (/*board*/ ctx[0][/*i*/ ctx[7]][/*j*/ ctx[8]] === 4) return create_if_block_4;
    		if (/*board*/ ctx[0][/*i*/ ctx[7]][/*j*/ ctx[8]] === 5) return create_if_block_5;
    		if (/*board*/ ctx[0][/*i*/ ctx[7]][/*j*/ ctx[8]] === 6) return create_if_block_6;
    		if (/*board*/ ctx[0][/*i*/ ctx[7]][/*j*/ ctx[8]] === 7) return create_if_block_7;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(298:5) {#each row as cell , j}",
    		ctx
    	});

    	return block;
    }

    // (296:3) {#each board as row, i}
    function create_each_block(ctx) {
    	let div;
    	let t_1;
    	let each_value_1 = /*row*/ ctx[32];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t_1 = space();
    			attr_dev(div, "class", "row svelte-1gmtuxg");
    			add_location(div, file, 296, 4, 6144);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t_1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*board*/ 1) {
    				each_value_1 = /*row*/ ctx[32];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t_1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(296:3) {#each board as row, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let h3;
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let div0;
    	let mounted;
    	let dispose;
    	let each_value = /*board*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Shitty Tetris";
    			t1 = space();
    			h3 = element("h3");
    			t2 = text("Score: ");
    			t3 = text(/*score*/ ctx[1]);
    			t4 = space();
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "game-container svelte-1gmtuxg");
    			add_location(h1, file, 291, 1, 5981);
    			attr_dev(h3, "class", "game-container svelte-1gmtuxg");
    			add_location(h3, file, 292, 1, 6028);
    			add_location(div0, file, 294, 2, 6107);
    			attr_dev(div1, "class", "game-container svelte-1gmtuxg");
    			add_location(div1, file, 293, 1, 6076);
    			attr_dev(main, "class", "svelte-1gmtuxg");
    			add_location(main, file, 290, 0, 5973);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h3);
    			append_dev(h3, t2);
    			append_dev(h3, t3);
    			append_dev(main, t4);
    			append_dev(main, div1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*keydown_handler*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*score*/ 2) set_data_dev(t3, /*score*/ ctx[1]);

    			if (dirty[0] & /*board*/ 1) {
    				each_value = /*board*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function generateBoard(board, m, n) {
    	for (let i = 0; i < n; ++i) {
    		board[i] = [];

    		for (let j = 0; j < m; ++j) {
    			board[i][j] = 0;
    		}
    	}

    	return board;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	//--------------     Pieces     ----------------//
    	let i = [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]];

    	let o = [[2, 2], [2, 2]];
    	let t = [[0, 3, 0], [3, 3, 3], [0, 0, 0]];
    	let s = [[0, 4, 4], [4, 4, 0], [0, 0, 0]];
    	let z = [[5, 5, 0], [0, 5, 5], [0, 0, 0]];
    	let j = [[6, 0, 0], [6, 6, 6], [0, 0, 0]];
    	let l = [[0, 0, 7], [7, 7, 7], [0, 0, 0]];

    	//-------------- Initialisation ----------------//
    	let gameOver = false;

    	let board = [[]];
    	let staticBoard = [[]];
    	let score = 0;
    	let tickSpeed = 800;
    	let currentPos = [0, 4];
    	let round = 1;
    	let pieceChosen = 0;
    	const pieces = [i, o, t, s, z, j, l];

    	function generatePiece() {
    		pieceChosen = Math.floor(Math.random() * pieces.length);
    		return pieces[pieceChosen];
    	}

    	let currentPiece = generatePiece();
    	board = generateBoard(board, 10, 20);
    	staticBoard = generateBoard(staticBoard, 10, 20);

    	function drawBoard() {
    		for (let i = 0; i < staticBoard.length; i++) {
    			for (let j = 0; j < staticBoard[i].length; j++) {
    				if (staticBoard[i][j] !== 0) {
    					$$invalidate(0, board[i][j] = staticBoard[i][j], board);
    				}
    			}
    		}

    		return board;
    	}

    	function drawPiece(currentPos) {
    		let [x, y] = currentPos;

    		for (let i = 0; i < currentPiece.length; i++) {
    			for (let j = 0; j < currentPiece[i].length; j++) {
    				if (currentPiece[i][j] !== 0) {
    					$$invalidate(0, board[x + i][y + j] = currentPiece[i][j], board);
    				}
    			}
    		}

    		return board;
    	}

    	function unDrawPiece(currentPos) {
    		let [x, y] = currentPos;

    		for (let i = 0; i < currentPiece.length; i++) {
    			for (let j = 0; j < currentPiece[i].length; j++) {
    				if (currentPiece[i][j] === 0) {
    					continue;
    				}

    				$$invalidate(0, board[x + i][y + j] = 0, board);
    			}
    		}

    		return board;
    	}

    	function collisionCheck(dx, dy, piece) {
    		for (let i = 0; i < piece.length; i++) {
    			for (let j = 0; j < piece[i].length; j++) {
    				if (piece[i][j] === 0) {
    					continue;
    				}

    				let potentialX = currentPos[0] + i + dx;
    				let potentialY = currentPos[1] + j + dy;

    				if (potentialX >= 20 || potentialY < 0 || potentialY > 9) {
    					return true;
    				} else if (staticBoard[potentialX][potentialY] !== 0) {
    					return true;
    				}
    			}
    		}

    		return false;
    	}

    	function addToStatic() {
    		for (let i = 0; i < currentPiece.length; i++) {
    			for (let j = 0; j < currentPiece[i].length; j++) {
    				if (currentPiece[i][j] !== 0) {
    					staticBoard[i + currentPos[0]][j + currentPos[1]] = currentPiece[i][j];
    				}
    			}
    		}

    		round += 1;
    		removeRows();
    		drawBoard();
    		return staticBoard;
    	}

    	function removeRows() {
    		let rowNum = 0;

    		for (let i = 0; i < staticBoard.length; i++) {
    			let removeLine = true;

    			for (let j = 0; j < staticBoard[i].length; j++) {
    				if (staticBoard[i][j] === 0) {
    					removeLine = false;
    				}
    			}

    			if (removeLine) {
    				staticBoard.splice(i, 1);
    				staticBoard.unshift([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    				board.splice(i, 1);
    				board.unshift([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    				rowNum++;
    			}
    		}

    		if (rowNum > 0) {
    			$$invalidate(1, score += 100 * Math.pow(2, rowNum - 1));
    		}
    	}

    	function gameIsOver() {
    		for (let i = 0; i < staticBoard.length; i++) {
    			for (let j = 0; j < staticBoard[i].length; j++) {
    				if (staticBoard[0][4] !== 0) {
    					gameOver = true;
    				}
    			}
    		}
    	}

    	function moveDown() {
    		if (collisionCheck(1, 0, currentPiece)) {
    			addToStatic();

    			if (!gameOver) {
    				currentPos = [0, 4];
    				currentPiece = generatePiece();
    			}
    		} else {
    			unDrawPiece(currentPos);
    			currentPos[0] += 1;
    			drawPiece(currentPos);
    		}
    	}

    	function moveRight() {
    		if (!collisionCheck(0, 1, currentPiece)) {
    			unDrawPiece(currentPos);
    			currentPos[1] += 1;
    			drawPiece(currentPos);
    		}
    	}

    	function moveLeft() {
    		if (!collisionCheck(0, -1, currentPiece)) {
    			unDrawPiece(currentPos);
    			currentPos[1] -= 1;
    			drawPiece(currentPos);
    		}
    	}

    	function rotate() {
    		let rotatedPiece = currentPiece[0].map((val, index) => currentPiece.map(row => row[index]).reverse());
    		let kickBack = 0;

    		if (collisionCheck(0, 0, rotatedPiece)) {
    			kickBack = currentPos[1] > 5 ? -1 : 1;
    			kickBack = pieceChosen === 6 ? -2 : 2;
    		}

    		if (!collisionCheck(0, kickBack, rotatedPiece)) {
    			unDrawPiece(currentPos);
    			currentPos[1] += kickBack;
    			currentPiece = rotatedPiece;
    			drawPiece(currentPos);
    		}
    	}

    	function play() {
    		setTimeout(
    			() => {
    				gameIsOver();

    				if (gameOver) {
    					return;
    				}

    				moveDown();
    				play();
    			},
    			tickSpeed - Math.log2(round) * 20
    		);
    	}

    	onMount(() => {
    		play();
    	});

    	function newGame() {
    		gameOver = false;
    		$$invalidate(1, score = 0);
    		currentPos = [0, 4];
    		$$invalidate(0, board = generateBoard(board, 10, 20));
    		staticBoard = generateBoard(staticBoard, 10, 20);
    		currentPiece = generatePiece();
    		play();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const keydown_handler = press => {
    		switch (press.key) {
    			case "ArrowLeft":
    				moveLeft();
    				break;
    			case "ArrowRight":
    				moveRight();
    				break;
    			case "ArrowDown":
    				$$invalidate(1, score += 1);
    				moveDown();
    				break;
    			case "Enter":
    				newGame();
    				break;
    			case "r":
    				rotate();
    				break;
    		}
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		i,
    		o,
    		t,
    		s,
    		z,
    		j,
    		l,
    		gameOver,
    		board,
    		staticBoard,
    		score,
    		tickSpeed,
    		currentPos,
    		round,
    		pieceChosen,
    		pieces,
    		generateBoard,
    		generatePiece,
    		currentPiece,
    		drawBoard,
    		drawPiece,
    		unDrawPiece,
    		collisionCheck,
    		addToStatic,
    		removeRows,
    		gameIsOver,
    		moveDown,
    		moveRight,
    		moveLeft,
    		rotate,
    		play,
    		newGame
    	});

    	$$self.$inject_state = $$props => {
    		if ("i" in $$props) $$invalidate(7, i = $$props.i);
    		if ("o" in $$props) o = $$props.o;
    		if ("t" in $$props) t = $$props.t;
    		if ("s" in $$props) s = $$props.s;
    		if ("z" in $$props) z = $$props.z;
    		if ("j" in $$props) $$invalidate(8, j = $$props.j);
    		if ("l" in $$props) l = $$props.l;
    		if ("gameOver" in $$props) gameOver = $$props.gameOver;
    		if ("board" in $$props) $$invalidate(0, board = $$props.board);
    		if ("staticBoard" in $$props) staticBoard = $$props.staticBoard;
    		if ("score" in $$props) $$invalidate(1, score = $$props.score);
    		if ("tickSpeed" in $$props) tickSpeed = $$props.tickSpeed;
    		if ("currentPos" in $$props) currentPos = $$props.currentPos;
    		if ("round" in $$props) round = $$props.round;
    		if ("pieceChosen" in $$props) pieceChosen = $$props.pieceChosen;
    		if ("currentPiece" in $$props) currentPiece = $$props.currentPiece;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		board,
    		score,
    		moveDown,
    		moveRight,
    		moveLeft,
    		rotate,
    		newGame,
    		i,
    		j,
    		keydown_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
