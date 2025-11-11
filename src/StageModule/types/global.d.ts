declare const APP_VERSION: string;

// arrays/tuples should use numeric indexes only, not "length"/methods
type IndexKey<T> = T extends readonly any[] ? number | keyof T : keyof T;

type KeyPath<T extends Object> = string | KeyArrayPath<T>;
type MethodPath<T extends Object> = string | MethodKeyArrayPath<T>;

/** Paths that may stop at any depth (prefixes allowed). */
type KeyArrayPath<T extends Object> =
    IsObject<T> extends true
        ? [] | { [K in IndexKey<T>]: [K, ...KeyPath<T[K]>] }[IndexKey<T>]
        : [];

type MethodKeyArrayPath<T extends Object> =
  IsObject<T> extends true
    ? {
        [K in IndexKey<T>]:
          // if T[K] is a function, the path is just [K]
          IsFn<T[K]> extends true
            ? [K]
            // otherwise, recurse and prepend K to every child path that ends at a function
            : MethodKeyArrayPath<T[K]> extends infer P
              ? P extends any[]
                ? [K, ...P]
                : never
              : never
      }[IndexKey<T>]
    : never;

/** Paths that must end on a non-object leaf. */
type LeafKeyPath<T> =
    IsObject<T> extends true
        ? { [K in IndexKey<T>]: [K, ...LeafKeyPath<T[K]>] }[IndexKey<T>]
        : [];

/** Value at the end of a path P inside T. */
type PathValue<T, P = KeyArrayPath<T>> =
    P extends [] ? T
    : P extends [infer K, ...infer R]
        ? K extends keyof T
        ? PathValue<T[K], R>
        : never
        : never;

type ResolvedAsObject<T> =
    T extends NonCustomObject ? ValueWrapper<T> :
        T extends object ? T : ValueWrapper<T>;

type OwnerType<R1, R2> = 
    IsWrapper<R1> extends true ? 
        R1 : IsWrapper<R2> extends true ? 
            R2 : any;
type OwnerKey<R1, R2> = Or<IsWrapper<R1>, IsWrapper<R2>> extends true ? "value" : PropertyKey

// Enum
declare type PassiveEventType = "tick" | "resize";
declare type MouseEventType =  "mousedown"|"mouseup"|"mousemove"|"mouseenter"|"mouseleave"|"wheel";
declare type KeyBoardEventType = "keydown"|"keypress"|"keyup";

declare type StageIntEventType = PassiveEventType | MouseEventType | KeyBoardEventType;

declare type InteractiveState = "idle"|"hover"|"pressed";

declare type HorizontalPosition = "left"|"centerH"|"right";
declare type VerticalPosition = "top"|"centerV"|"bottom";
declare type PivotSetting = [HorizontalPosition,VerticalPosition] | "center";

declare type AnimationType = "derive"|"toggle";

declare type Getter<T> = () => T;
declare type Caller<T> = T extends (...args: any[]) => infer R ? 
                            Getter<R> : undefined;
declare type Setter<T> = (v: T) => this;

declare type AttemptCallBack = <T extends object>(value: any, target: T, key: keyof T) => any;
declare type TraverseCallBack<R extends object, TS extends JSTypeSet = DefTypeSet> = <T extends object>(
    value: TypeOfSet<TS>,
    propOwner: T, 
    key: keyof T, 
    path: KeyArrayPath<R>
) => Voidable<boolean>;
type InteractCallBack<R1 extends object, R2 extends object> = (
    propOwner1: OwnerType<R1, R2>,
    propOwner2: OwnerType<R1, R2>,
    key: OwnerKey<R1, R2>,
    path: KeyArrayPath<R1 & R2>,
    root1: R1,
    root2: R2
) => boolean;

declare type Assertion<T> = (target: T) => boolean
declare type ClipFunction = (value: number, ...argArray: any[]) => number;

declare type ColorText = keyof typeof COLORS;
declare type ColorTuple = [number, number, number, number];

declare type DataAssignType = "identical"|"clone"|"uninit";

declare type Rotationizable = Rotation2D | number | string;
declare type Vectorizable =  Vector2D | [number,number] | string | number;
declare type Rectizable =  Rect2D | Array<number> | string | number;
declare type Colorizable = Color | string | number | Array<number>;
declare type Graphizable = string | Graphics2D | Polygon;
declare type Numerizable = number | string;
declare type Transfizable = string | ContextTransfProperties | ContextTransf | Object2D;

declare type ResizeCallBack<T> = (this: T, parent: Vector2D, ev: UIEvent) => any;

declare type TickEvent<T> = TickCallBack<T> & TickEventProperties;
declare type TickCallBack<T> = (this: T, ev: TickEvent<T>) => any;

declare type MouseEventInfo = MouseEvent | WheelEvent;
declare type MouseCallBack<T extends StageInteractive> = (this: T, ev: ContextMouseEvent) => any;

declare type KBCallBack<T extends StageInteractive> = (this: T, ev: KeyboardEvent) => any;

declare type Polygon = [number, number][];

// Interfaces

declare interface Reproducable {
    clone(): this;
    copy(other: Partial<this>): this;
}

declare interface Attributive<
    TObject extends Record<PropertyKey, any>,
    TKey extends keyof TObject = keyof TObject
> {
    readonly owner: TObject;
    readonly key: TKey;
}