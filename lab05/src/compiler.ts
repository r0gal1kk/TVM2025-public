import { c as C, Op, I32 } from "../../wasm";
import { Expr } from "../../lab04";
import { buildOneFunctionModule, Fn } from "./emitHelper";
const { i32, get_local } = C;

export function getVariables(e: Expr): string[] {
    const variables = new Set<string>();

    function collectVars(expr: Expr): void {
        switch (expr.type) {
            case 'variable':
                variables.add(expr.name);
                break;
            case 'add':
            case 'sub':
            case 'mul':
            case 'div':
                collectVars(expr.left);
                collectVars(expr.right);
                break;
            case 'neg':
                collectVars(expr.argument);
                break;
            case 'paren':
                collectVars(expr.argument);
                break;
            case 'number':
                break;
        }
    }

    collectVars(e);
    return Array.from(variables);
}

export async function buildFunction(e: Expr, variables: string[]): Promise<Fn<number>>
{
    let expr = wasm(e, variables);
    return await buildOneFunctionModule("test", variables.length, [expr]);
}

function wasm(e: Expr, args: string[]): Op<I32> {
    function compile(expr: Expr): Op<I32> {
        switch (expr.type) {
            case 'number':
                return i32.const(expr.value) as Op<I32>;

            case 'variable':
                const index = args.indexOf(expr.name);
                if (index === -1) {
                    return i32.const(0) as Op<I32>;
                }
                return get_local(i32, index) as Op<I32>;

            case 'add':
                return i32.add(compile(expr.left), compile(expr.right)) as Op<I32>;

            case 'sub':
                return i32.sub(compile(expr.left), compile(expr.right)) as Op<I32>;

            case 'mul':
                return i32.mul(compile(expr.left), compile(expr.right)) as Op<I32>;

            case 'div':
                return i32.div_s(compile(expr.left), compile(expr.right)) as Op<I32>;

            case 'neg':
                return i32.mul(compile(expr.argument), i32.const(-1) as Op<I32>) as Op<I32>;

            case 'paren':
                return compile(expr.argument);
        }
    }

    return compile(e);
}