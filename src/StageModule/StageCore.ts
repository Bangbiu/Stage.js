const DATA_CLONE: DataAssignType = "clone";
const DATA_IDEN: DataAssignType = "identical";
const DATA_UNINIT: DataAssignType = "uninit";
const ATTR_SPLITER: string = '.';
const RAW: unique symbol = Symbol("raw");

const noop = () => {};

let ASN_DEF: DataAssignType = DATA_CLONE;
let JSD_DEF: JSTypeSet = ["number", "boolean", "string"] as const;

function func(value: number | boolean | string): any;
function func<const T extends JSTypeSet = typeof JSD_DEF>(value: TypeOfSet<T>, types: T): any;
function func<const T extends JSTypeSet = typeof JSD_DEF>(
    value: TypeOfSet<T>,
    types: T = JSD_DEF as T
) {}

func(123, ["number"])
export {
    // Constants
    DATA_CLONE,
    DATA_IDEN,
    DATA_UNINIT,
    ATTR_SPLITER,
    RAW,

    // Variables
    ASN_DEF,
    JSD_DEF,

    // Function
    noop
}