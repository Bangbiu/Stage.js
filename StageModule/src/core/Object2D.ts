import { Vector2D, Rect2D, Rotation2D, Color } from "./Struct.js";
import { Graphics2D } from "./Graphics2D.js";
import { Animation } from "./Animation.js";
import { 
    SObject, 
    ASN_DEF, 
    DATA_IDEN, 
    DATA_UNINIT, 
    DATA_CLONE, 
    StateMap, 
    ListenerList, 
    ListenerMap
} from "./DataUtil.js";
import { 
    AnimationType, 
    ContextTransfProperties, 
    DataAssignType, 
    MouseCallBack, 
    MouseEventBehavior, 
    MouseEventInfo, 
    Object2DProperties, 
    Renderable, 
    StageInteractiveProperties, 
    StageObjectProperties, 
    TickCallBack, 
    TickEventProperties, 
    TickEvent,
    Transfizable, 
    Vectorizable, 
    Numerizable,
    Polymorphistic,
    KBCallBack,
    StageIntEventType,
    PassiveEventType,
    MouseEventType,
    KeyBoardEventType,
    RenderableProperties,
    ResizeCallBack
} from "./TypeUtil.js";

export {
    ContextTransf,
    ContextMouseEvent,
    PassiveListeners,
    InteractiveListeners,

    Object2D,
    StageObject,
    StageInteractive,
    StageDynamic,
}

enum EVENTYPE {
    TICK = "tick",
    RESIZE = "resize",
    
    MOUSEMOVE = "mousemove",
    MOUSEENTER = "mouseenter",
    MOUSLEAVE = "mouseleave",
    MOUSEDOWN = "mousedown",
    MOUSEUP = "mouseup",
    MOUSEWHEEL = "wheel",

    KEYDOWN = "keydown",
    KEYPRESS = "keypress",
    KEYUP = "keyup",
}

class ContextMouseEvent {
    /** @type {MouseEvent | WheelEvent} Event Arguments*/ info: MouseEventInfo;
    /** @type {Vector2D} Absolute Mouse Position*/        mousePos;
    /** @type {Vector2D} Relative Mouse Position*/        mCtxPos;
    /**
     * 
     * @param {MouseEvent | WheelEvent} event 
     */
    constructor(event) {
        this.info = event;
        let box = /** @type {HTMLCanvasElement} */ (event.target).getBoundingClientRect();
        this.mousePos = new Vector2D(event.clientX-box.left, event.clientY-box.top);
        this.mCtxPos = this.mousePos.clone();
    }
}

class PassiveListeners<T> extends ListenerMap {
    tick: ListenerList<TickEvent<T>> = new ListenerList();
    resize: ListenerList<ResizeCallBack<T>> = new ListenerList();

    constructor(map?: PassiveListeners<T>) {
        super();
        if (map != undefined) this.copy(map);
    }

    clone(): PassiveListeners<T> {
        return new PassiveListeners(this);
    }

    addEventListener(eventType: PassiveEventType, listener: TickEvent<T> | ResizeCallBack<T>) {
        this[eventType].push(listener as any);
    }

    updateOnTick(actor: any, delta: number = 1.0) {
        this.tick.forEach(event => {
            if (!event.enable) return;
            event.prog += delta;
            if (event.prog >= event.interval) {
                event.prog = 0;
                event.repeat--;
                event.call(actor, event);
            }
        });
        this.tick.filter((event)=>(event.repeat != 0));
    }

    trigger(actor: any, eventType: PassiveEventType, ...argArray: any[]) {
        this[eventType].trigger(actor, ...argArray);
    }
}

class InteractiveListeners<T extends StageInteractive> extends PassiveListeners<T> {

    mousedown:  ListenerList<MouseCallBack<T>> = new ListenerList();
    mouseup:    ListenerList<MouseCallBack<T>> = new ListenerList();
    mousemove:  ListenerList<MouseCallBack<T>> = new ListenerList();
    mouseenter: ListenerList<MouseCallBack<T>> = new ListenerList();
    mouseleave: ListenerList<MouseCallBack<T>> = new ListenerList();
    wheel: ListenerList<MouseCallBack<T>> = new ListenerList();

    keydown: ListenerList<KBCallBack<T>> = new ListenerList();
    keypress: ListenerList<KBCallBack<T>> = new ListenerList();
    keyup: ListenerList<KBCallBack<T>> = new ListenerList();

    constructor(map?: InteractiveListeners<T>) {
        super();
        if (map != undefined) this.copy(map);
    }

    clone(): InteractiveListeners<T> {
        return new InteractiveListeners(this);
    }

    addEventListener(eventType: StageIntEventType, listener: any) {
        this[eventType].push(listener);
    }

    trigger(actor: any, eventType: StageIntEventType, ...argArray: any[]) {
        this[eventType].trigger(actor, ...argArray);
    }

    addBehavior(behavior: MouseEventBehavior<T>) {
        if (behavior.bhvname in this) this.removeBehavior(behavior.bhvname);
        for (const key in behavior) {
            if (key in this) {
                this[key].push(behavior[key]);
            }
        }
        this[behavior.bhvname] = behavior;
    }

    removeBehavior(behvrName: string) {
        if (behvrName in this) {
            const behvr = this[behvrName];
            for (const key in behvr) {
                if (key in this) 
                    this[key] = this[key].filter((elem)=>(elem != behvr[key]));
            }
            delete this[behvrName];
        }
    }

    static BEHAVIOR_DRAGGABLE: MouseEventBehavior<StageInteractive> = {
        bhvname: "draggable",
        mousedown: function(event) {
            if (!this.isInsideInteracting())
                this["ctrlPt"] = event.mCtxPos.clone().sub(this.pos);
        },
        mouseup: function(event) {
            delete this["ctrlPt"];
        },
        mousemove: function(event) {
            if (this["ctrlPt"] != undefined) {
                this.pos.copy(event.mCtxPos).sub(this["ctrlPt"]);
            }
        }
    }
}

class Object2D extends SObject implements Renderable, Object2DProperties, Polymorphistic {
    ID: number;

    frame: Rect2D;
    pos: Vector2D;
    scale: Vector2D;
    stret: Vector2D;
    rot: Rotation2D;
    transf: ContextTransf;
    graphics: Graphics2D; 

    fillColor: Color;
    borderColor: Color; 
    emissiveColor: Color; 

    emissive: number = 0.0;
    borderWidth: number = 0.0;
    visible: boolean = true;

    listeners: PassiveListeners<typeof this>;
    states: StateMap<Object2DProperties> | undefined;

    debug: boolean = false;

    constructor( parameters: Object2DProperties = {} , assign = DATA_IDEN) {
        super();
        this.initialize(parameters, Object2D.DEF_PROP, assign);
    }

    initialize( parameters: Object2DProperties = {}, 
        def: Object2DProperties = Object2D.DEF_PROP, 
        assign: DataAssignType = DATA_IDEN): this 
    {
        //Prevent init
        if (assign == DATA_UNINIT) return this;

        Object2D.ObjectList?.push(this);
        if (this.class != "Object2D") {  
            this.constructor["ObjectList"]?.push(this);
        }
        super.initialize(parameters, def, assign);

        this.ID = this.constructor["CUM_INDEX"];
        this.constructor["CUM_INDEX"]++;
        return this;
    }

    updateValues(values: Object2DProperties, assign: DataAssignType = ASN_DEF): this {
        super.updateValues(values, assign);
        //Linking
        if (values.transf != undefined) {
            this.resolve("transf", ContextTransf);
            this.pos = this.transf.trans;
            this.rot = this.transf.rot;
            this.stret = this.transf.scale;
        } else {
            this.transf = new ContextTransf(this, DATA_IDEN);
        }
        if (this.states?.currentState == 0) this.states.bind(this);
        return this;
    }

    resolveAll(other: Object2DProperties = this): this {
        SObject.resolve(other,"pos", Vector2D);
        SObject.resolve(other,"rot", Rotation2D);
        SObject.resolve(other, "stret", Vector2D);

        SObject.resolve(other, "frame", Rect2D);
        SObject.resolve(other, "scale", Vector2D);

        SObject.resolve(other, "graphics", Graphics2D);

        SObject.resolve(other, "fillColor", Color);
        SObject.resolve(other, "borderColor", Color);
        SObject.resolve(other, "emissiveColor", Color);

        SObject.resolve(other, "states", StateMap);
    
        return this;
    }

    get name(): string {
        return this.class + "_" + this.ID;
    }

    get x(): number {
        return this.pos.x;
    }

    set x(value: number) {
        this.pos.x = value;
    }

    get y(): number {
        return this.pos.y;
    }

    set y(value: number) {
        this.pos.y = value;
    }

    get width(): number {
        return this.graphics.bound.width * this.scale.x * this.stret.x;
    }

    set width(value: number) {
        this.scale.x = value / this.graphics.bound.width / this.stret.x;
    }

    get height(): number {
        return this.graphics.bound.height * this.scale.y * this.stret.y;
    }

    set height(value: number) {
        this.scale.y = value / this.graphics.bound.height / this.stret.y;
    }

    get dimension(): Vector2D {
        return this.graphics.bound.dimension.scale(this.scale);
    }

    get bound(): Rect2D {
        return this.graphics.bound.clone().scale(this.scale);
    }

    get innerBound(): Rect2D {
        return this.graphics.bound;
    }

    moveTo(x: number = 0, y: number = 0): this {
        this.pos.moveTo(x,y);
        return this;
    }

    resize(parent: Vector2D, event: UIEvent = undefined): this {
        if (this.frame instanceof Rect2D) {
            if (this.frame.x != undefined)
                this.pos.x = parent.x * this.frame.x;
            if (this.frame.y != undefined)
                this.pos.y = parent.y * this.frame.y;
            if (this.frame.width != undefined)
                this.width = parent.x * this.frame.width;
            if (this.frame.height != undefined)
                this.height = parent.y * this.frame.height;
        }
        this.listeners?.trigger(this, EVENTYPE.RESIZE, parent, event);
        return this;
    }

    copy(other: Object2DProperties): this {
        const ID = this.ID;
        super.copy(other);
        this.ID = ID;
        return this;
    }

    copyStyle(other: RenderableProperties) {
        this.copy(SObject.subset(other,
            ["graphics", "fillColor", "borderColor", "emissiveColor", 
            "emissive", "borderWidth", "visible"]
        ));
    }

    clone(): Object2D {
        return new Object2D(this, DATA_CLONE);
    }

    addState(stateOrKey: Object2DProperties | Numerizable, state?: Object2DProperties): void {
        if (this.states == undefined) this.states = new StateMap().bind(this);
        if (typeof stateOrKey == "object") 
            this.states.push(stateOrKey);
        else 
            this.states.put(stateOrKey, state);
    }

    refresh(): this {
        if (this.states != undefined) 
            this.updateValues(this.states.fetch(), DATA_IDEN);
        return this;
    }

    switchTo(key: Numerizable) {
        if (key != undefined && this.states != undefined && key in this.states) {
            this.updateValues(this.states.swtichTo(key), DATA_IDEN);
            this.resolveAll();
        }
            
    }

    toggle(): this {
        if (this.states != undefined) {
            this.updateValues(this.states.toggle(), DATA_IDEN);
        }
        return this;
    }

    restore() {
        this.updateValues(this.states[0], DATA_IDEN);
    }

    isInside(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        let res;
        ctx.save();
        this.transform(ctx);
        res = ctx.isPointInPath(this.graphics.scaledPath(this.scale), x, y);
        if (this.graphics.clipper != undefined) {
            res = res && ctx.isPointInPath(this.graphics.scaledClip(this.scale), x, y);
        }
        ctx.restore();
        return res;
    }

    isInBound(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
        let res;
        ctx.save();
        this.transform(ctx);
        res = ctx.isPointInPath(this.graphics.boundPath, x, y);
        ctx.restore();
        return res;
    }

    transform<T>(ctxOrPos: T): T {
        if (ctxOrPos instanceof Vector2D) {
            this.transf.apply(ctxOrPos);
        } else if (ctxOrPos instanceof CanvasRenderingContext2D) {
            this.transf.transform(ctxOrPos);
        }
        return ctxOrPos;
    }

    tick(ctx: CanvasRenderingContext2D, delta: number = 1) {
        this.update(delta);
        this.render(ctx);
    }
    
    update(delta: number = 1.0) {
        this.listeners?.updateOnTick(this, delta);
    } 

    render(ctx: CanvasRenderingContext2D = Object2D.DefaultContext) {
        if (!this.visible) return;
        ctx.save();
        this.transform(ctx);

        //Render Emissive
        if (this.emissive > 0) {
            ctx.shadowBlur = this.emissive;
            ctx.shadowColor = this.emissiveColor.value;
        }

        ctx.fillStyle = this.fillColor.value;
        ctx.strokeStyle = this.borderColor.value;
        ctx.lineWidth = this.borderWidth;
        
        this.graphics.render(ctx,
            this.scale,
            this.borderWidth != 0 && this.borderColor != undefined, 
            this.fillColor != undefined, 
        );

        if (this.debug) {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            this.graphics.renderBound(ctx, this.scale, true, false);
        }
        
        ctx.restore();
    }

    addTickEventListener(listener: TickCallBack<typeof this>, settings: TickEventProperties = {}): TickEvent<typeof this> {
        const event = Object.assign(listener, Object2D.DEF_TICKEVENTPROP);
        this.listeners.addEventListener(EVENTYPE.TICK, Object.assign(event, settings));
        return event;  
    }

    addResizeListener(listener: ResizeCallBack<typeof this>): this {
        this.listeners.addEventListener(EVENTYPE.RESIZE, listener);
        return this;
    }

    temporify(life: number = 100): void {
        this.addTickEventListener(this.finalize, {
            eventName: "finalizeCountDown",
            interval: life
        });
    }

    animate(propText: string, data: any[], interval: number=1, type: AnimationType = "derive"): TickEvent<typeof this> {
        let attr = this.access(propText);
        if (attr == undefined) return undefined;
        let tickfunc = Animation[type](attr,data);
        if (tickfunc == undefined) {
            console.warn("Property to animate does not exist!");
            return undefined;
        }

        return this.addTickEventListener(tickfunc, {
            eventName: "animationOn_" + propText,
            interval: interval,
            repeat: -1
        });
    }


    finalize(): void {
        Object2D.ObjectList?.splice(Object2D.ObjectList.indexOf(this), 1);
        if (this.class != "Object2D") {
            const clsObjList: Array<typeof this> = this.constructor["ObjectList"];
            clsObjList?.splice(clsObjList.indexOf(this), 1);
        }
    }

    toString(): string {
        return `<Object2D:${this.name}>`;
    }

    //Statics
    static ObjectList: Object2D[] = undefined;
    static DefaultContext: CanvasRenderingContext2D = undefined;
    static CUM_INDEX: number = 0;

    static DEF_PROP: Object2DProperties = {
        frame: undefined,
        pos: new Vector2D(),
        scale: new Vector2D(1,1),
        stret: new Vector2D(1,1),
        rot: 0,
        transf: undefined,
        graphics: "square",

        fillColor: new Color("white"),
        borderColor: new Color("black"),
        emissiveColor: undefined,

        emissive: 0,
        borderWidth: 0,
        visible: true,

        listeners: new PassiveListeners(),
        states: undefined,

        debug: false
    };

    static DEF_TICKEVENTPROP: TickEventProperties = {
        eventName: "unknow",
        prog: 0,
        interval: 100,
        repeat: -1,
        enable: true
    }

}

class StageObject extends Object2D implements StageObjectProperties {

    components: Object2D[] = [];
    innerTransf: ContextTransf;
    mainBody: boolean;
    clipWithin: boolean;
    declare states: StateMap<StageObjectProperties>;

    constructor( parameters: StageObjectProperties = {} , assign: DataAssignType = DATA_IDEN) {
        super({}, DATA_UNINIT);
        this.initialize(parameters, StageObject.DEF_PROP, assign);
    }

    set pivot(value: Vectorizable) {
        this.innerTransf.trans =  new Vector2D(value).scaleXY(this.width, this.height);
    }

    add(comp: Object2D): this {
        this.components.push(comp);
        return this;
    }

    clone(): StageObject {
        return new StageObject(this, DATA_CLONE);
    }

    toInternal<T>(ctxOrPos: T): T {
        if (ctxOrPos instanceof Vector2D) {
            this.transf.apply(ctxOrPos);
            this.innerTransf.apply(ctxOrPos);
        } else if (ctxOrPos instanceof CanvasRenderingContext2D) {
            this.transf.transform(ctxOrPos);
            this.innerTransf.transform(ctxOrPos);
        }
        return ctxOrPos;
    }

    resize(parent: Vector2D, event?: UIEvent): this {
        super.resize(parent, event);
        return this.resizeChildren(event);
    }

    resizeChildren(event: UIEvent): this {
        this.components.forEach(comp => {
            comp.resize(this.dimension, event);
        });
        return this;
    }

    refresh(): this {
        this.components.forEach(comp => {
            comp.refresh();
        });
        super.refresh();
        return this;
    }

    update(delta: number = 1): void {
        super.update(delta);
        // Components Update
        this.components.forEach(comp => {
            comp.update(delta);
        });
    }

    render(ctx: CanvasRenderingContext2D = Object2D.DefaultContext, ...coRender: Renderable[]) {
        if (this.mainBody) super.render(ctx);

        //Render Components
        ctx.save();
        //Clip Within
        this.transform(ctx);
        if (this.clipWithin) {
            ctx.clip(this.graphics.scaledPath(this.scale));
        }
        this.innerTransf.transform(ctx);
        this.components.forEach(comp => {
            comp.render(ctx);
        });
        coRender.forEach(renderee => {
            renderee.render(ctx);
        });
        ctx.restore();
    }

    isInGroup(x: number, y: number, ctx: CanvasRenderingContext2D = Object2D.DefaultContext): boolean {
        if (this.mainBody && this.isInside(x,y,ctx)) return true;
        let res = false;
        ctx.save();
        this.toInternal(ctx);
        this.components.every(comp => {
            if (comp.isInside(x, y, ctx)) {
                res = true;
                return false;
            } 
            return true;
        });

        ctx.restore();
        return res;
    }

    static DEF_PROP: StageObjectProperties = SObject.insertValues({
        mainBody: true,
        clipWithin: false,
        innerTransf: new ContextTransf(),
        states: undefined
    }, Object2D.DEF_PROP, DATA_CLONE);

    static ObjectList: StageObject[] = undefined;
    static CUM_INDEX: number = 0;
}


class StageInteractive extends StageObject implements StageInteractiveProperties {
    isMouseIn: boolean = false;
    declare listeners: InteractiveListeners<typeof this>;
    declare states: StateMap<StageInteractiveProperties>;
    
    constructor( parameters: StageInteractiveProperties = {}, assign: DataAssignType = DATA_IDEN) {
        super({}, DATA_UNINIT);
        this.initialize(parameters, StageInteractive.DEF_PROP, assign);
        if (StageInteractive.CanvasDOM != undefined) 
            this.bindMouseEvents(StageInteractive.CanvasDOM);
    }

    get draggable(): boolean {
        return "draggable" in this.listeners;
    }

    set draggable(value: boolean) {
        if (value) {
            this.listeners.addBehavior(InteractiveListeners.BEHAVIOR_DRAGGABLE);
        } else {
            this.listeners.removeBehavior("draggable");
        }
    }

    clone(): StageInteractive {
        return new StageInteractive(this, DATA_CLONE);
    }

    resolveAll(other: StageInteractiveProperties = this): this {
        SObject.resolve(other, "states", StateMap);
        super.resolveAll(other);
        return this;
    }

    bindKeyboardEvents(): this {
        window.addEventListener(EVENTYPE.KEYDOWN, this.updateKeyBoardInfo.bind(this));
        window.addEventListener(EVENTYPE.KEYPRESS, this.updateKeyBoardInfo.bind(this));
        window.addEventListener(EVENTYPE.KEYUP, this.updateKeyBoardInfo.bind(this));
        return this;
    }

    bindMouseEvents(canv: HTMLCanvasElement): this {
        let ctx = /** @type {CanvasRenderingContext2D} */canv.getContext("2d");
        canv.addEventListener(EVENTYPE.MOUSEDOWN, this.updateMouseInfo.bind(this,ctx));
        canv.addEventListener(EVENTYPE.MOUSEUP, this.updateMouseInfo.bind(this,ctx));
        canv.addEventListener(EVENTYPE.MOUSEMOVE, this.updateMouseInfo.bind(this,ctx));
        canv.addEventListener(EVENTYPE.MOUSEWHEEL,this.updateMouseInfo.bind(this,ctx));
        return this;
    }

    addMouseEventListener(eventType: MouseEventType, listener: MouseCallBack<typeof this>): this {
        this.listeners.addEventListener(eventType, listener);  
        return this;
    }

    addKeyBoardListener(eventType: KeyBoardEventType, listener: KBCallBack<typeof this>): this {
        this.listeners.addEventListener(eventType, listener);
        return this;
    }

    isInsideInteracting(): boolean {
        for(let i = 0; i < this.components.length; i++) {
            const comp = this.components[i];
            if (comp instanceof StageInteractive && comp.isMouseIn) 
                return true;
        }
        return false;
    }

    onKeyDown(event: KeyboardEvent) {
        this.listeners.trigger(this, EVENTYPE.KEYDOWN, event);
    }

    onKeyPress(event: KeyboardEvent) {
        this.listeners.trigger(this, EVENTYPE.KEYPRESS, event);
    }

    onKeyUp(event: KeyboardEvent) {
        this.listeners.trigger(this, EVENTYPE.KEYUP, event)
    }
    
    onMouseEnter(event: ContextMouseEvent) {
        this.listeners.trigger(this, EVENTYPE.MOUSEENTER, event);
    }

    onMouseLeave(event: ContextMouseEvent){
        this.listeners.trigger(this, EVENTYPE.MOUSLEAVE, event);
    }

    onMouseMove(event: ContextMouseEvent) {
        this.listeners.trigger(this, EVENTYPE.MOUSEMOVE, event);
    }

    onMouseDown(event: ContextMouseEvent) {
        this.listeners.trigger(this, EVENTYPE.MOUSEDOWN, event);
    }

    onMouseUp(event: ContextMouseEvent) {
        this.listeners.trigger(this, EVENTYPE.MOUSEUP, event);
    }

    onMouseWheel(event: ContextMouseEvent) {
        this.listeners.trigger(this, EVENTYPE.MOUSEWHEEL, event);
    }

    updateMouseInfo(ctx: CanvasRenderingContext2D = Object2D.DefaultContext, event: ContextMouseEvent | MouseEventInfo) {
        if (!(event instanceof ContextMouseEvent)) 
            event = new ContextMouseEvent(event);
        ctx.save();
        //Update Inside State
        let mtest = this.isInside(event.mousePos.x,event.mousePos.y, ctx);
        if (mtest && !this.isMouseIn) {
            this.isMouseIn = true;
            this.onMouseEnter(event);
        } else if (!mtest && this.isMouseIn) {
            this.isMouseIn = false;
            this.onMouseLeave(event);
        }
        //Trigger Event
        if (this.isMouseIn) {
            
            
            switch (event.info.type) {
                case EVENTYPE.MOUSEDOWN: { 
                    this.onMouseDown(event); 
                    //console.log(this.name + " " + event.info.type);
                    break; 
                    
                }
                case EVENTYPE.MOUSEUP : { this.onMouseUp(event); break;}
                case EVENTYPE.MOUSEMOVE : { this.onMouseMove(event); break;} 
                case EVENTYPE.MOUSEWHEEL : { this.onMouseWheel(event); break;}
            }
            this.toInternal(ctx);
            this.toInternal(event.mCtxPos);
            this.components.forEach(comp => {
                if (comp instanceof StageInteractive) {
                    comp.updateMouseInfo(ctx,event);
                    if (comp.isMouseIn) return;
                }
            });
        }
        ctx.restore();
    }

    updateKeyBoardInfo(event: KeyboardEvent) {
        switch (event.type) {
            case EVENTYPE.KEYDOWN: { this.onKeyDown(event); break; }
            case EVENTYPE.KEYPRESS : { this.onKeyPress(event); break;}
            case EVENTYPE.KEYUP : { this.onKeyUp(event); break;} 
        }
        this.components.forEach(comp => {
            if (comp instanceof StageInteractive) {
                comp.updateKeyBoardInfo(event);
            }
        });
    }

    static CUM_INDEX: number = 0;
    static ObjectList: StageInteractive[] = [];
    static CanvasDOM: HTMLCanvasElement = undefined;
    static DEF_PROP: StageInteractiveProperties = SObject.insertValues({
        listeners: new InteractiveListeners(),
        states: undefined
    }, StageObject.DEF_PROP, DATA_CLONE);
}

class StageDynamic extends StageInteractive {
    /** @type {Vector2D} */ vel;
    /** @type {Color} */ tColor;

    //Debug
    velRay = false;
    rotRay = false;
    traceOn = false; traceLmt = 100;
    tracePts = [];
    mass = 1;

    //Data Processing
    moveBy(offX, offY=0) {
        this.pos.moveBy(offX, offY);
    }

    moveBy_R(offX, offY=0) {
        this.pos.moveBy(...new Vector2D(offX, offY).rotate(this.rot.value).value);
    }

    still() {
        this.vel.clear();
    }

    exertForce(outerFX, outerFY=0) {
        this.vel.moveBy(outerFX / this.mass, outerFY / this.mass)
    }

    exertForce_R(outerFX, outerFY=0) {
        this.exertForce(...new Vector2D(outerFX, outerFY).rotate(this.rot.value).value);
    }

    traceCurPos() {
        this.tracePts.push(this.pos.value);
        if (this.tracePts.length > this.traceLmt) this.tracePts.splice(0,1);
    }

    drawTrace(ctx) {
        ctx.save();
        ctx.strokeStyle = this.tColor.value;
        ctx.shadowBlur = this.emissive;
        ctx.shadowColor = this.emissiveColor.value;
        ctx.lineWidth = 3;
        ctx.moveTo(...this.tracePts[0]);
        this.tracePts.forEach(pt => {
            ctx.lineTo(...pt);
        });
        
        ctx.lineTo(this.pos.x,this.pos.y);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 
     * @param {Number} delta 
     * @returns {void}
     */
    update(delta) {
        super.update(delta);
        // Update Position
        this.pos.moveBy(this.vel.x * delta, this.vel.y * delta);
        return;
    }

    render(ctx) {
        super.render(ctx);
        if (this.traceOn) {
            this.traceCurPos();
            this.drawTrace(ctx);
        }
        //Debug Rays
        if (this.velRay || this.rotRay) {
            ctx.beginPath();
            if (this.velRay) {
                ctx.moveTo(0,0);
                ctx.lineTo(this.vel.x * 100, this.vel.y * 100);
            }
            ctx.closePath();
            ctx.stroke();
        }
    }

    //Statics
    static DEF_VELOCITY = new Vector2D(0.0,0.0);
    static DEF_ROTATION = new Rotation2D(0.0);
    static DEF_SCALE = new Vector2D(1,1);
    static DEF_FILLCOLOR = new Color("white");
    static DEF_BORDEDR_COLOR = new Color("black");
    static DEF_BORDER_WIDTH = 3;
    //static DEF_GRAPHICS = new Graphics2D("square");
    static DEF_LIFE = -100;
}