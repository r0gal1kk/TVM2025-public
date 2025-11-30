import { Expr, NumberExpr, VariableExpr, AddExpr, SubExpr, MulExpr, DivExpr, NegExpr, ParenExpr } from "../../lab04";

function isZero(e: Expr): boolean {
    return e.type === 'number' && e.value === 0;
}

function isOne(e: Expr): boolean {
    return e.type === 'number' && e.value === 1;
}

const num = (n: number): NumberExpr => ({ type: 'number', value: n });
const variable = (v: string): VariableExpr => ({ type: 'variable', name: v });

const neg = (e: Expr): Expr => {
    if (isZero(e)) return num(0);
    if (e.type === 'neg') return (e as NegExpr).argument;
    if (e.type === 'div') {
        const divExpr = e as DivExpr;
        return { type: 'div', left: neg(divExpr.left), right: divExpr.right };
    }
    if (e.type === 'mul') {
        const mulExpr = e as MulExpr;
        return { type: 'mul', left: neg(mulExpr.left), right: mulExpr.right };
    }
    return { type: 'neg', argument: e };
};

const add = (l: Expr, r: Expr): AddExpr => ({ type: 'add', left: l, right: r });
const sub = (l: Expr, r: Expr): SubExpr => ({ type: 'sub', left: l, right: r });
const mul = (l: Expr, r: Expr): MulExpr => ({ type: 'mul', left: l, right: r });
const div = (l: Expr, r: Expr): DivExpr => ({ type: 'div', left: l, right: r });

const bin = (op: string, l: Expr, r: Expr): Expr => {
    if (op === "+") {
        if (isZero(l)) return r;
        if (isZero(r)) return l;
        return add(l, r);
    } else if (op === "-") {
        if (isZero(r)) return l;
        if (isZero(l)) return neg(r);
        return sub(l, r);
    } else if (op === "*") {
        if (isZero(l) || isZero(r)) return num(0);
        if (isOne(l)) return r;
        if (isOne(r)) return l;
        return mul(l, r);
    } else if (op === "/") {
        if (isZero(l)) return num(0);
        if (isOne(r)) return l;
        return div(l, r);
    }
    throw new Error(`Unknown operator: ${op}`);
};

const isSum = (e: Expr) => e.type === 'add' || e.type === 'sub';

function asSum(e: Expr): Expr[] {
    if (e.type === 'add') {
        const addExpr = e as AddExpr;
        return [...asSum(addExpr.left), ...asSum(addExpr.right)];
    }
    if (e.type === 'sub') {
        const subExpr = e as SubExpr;
        return [...asSum(subExpr.left), ...asSum(neg(subExpr.right))];
    }
    return [e];
}

function asProd(e: Expr): Expr[] {
    if (e.type === 'mul') {
        const mulExpr = e as MulExpr;
        return [...asProd(mulExpr.left), ...asProd(mulExpr.right)];
    }
    return [e];
}

function canonical(e: Expr): string {
    switch (e.type) {
        case 'number': return `#${e.value}`;
        case 'variable': return `v:${e.name}`;
        case 'neg': return `neg(${canonical((e as NegExpr).argument)})`;
        case 'add':
        case 'sub':
        case 'mul':
        case 'div':
            const binExpr = e as AddExpr | SubExpr | MulExpr | DivExpr;
            if (e.type === 'mul') {
                const parts = asProd(e).map(canonical).filter(s => !s.startsWith("#"));
                parts.sort();
                return parts.join("*");
            }

            const operatorMap = {
                'add': '+',
                'sub': '-',
                'mul': '*',
                'div': '/'
            };

            return `(${canonical(binExpr.left)}${operatorMap[e.type]}${canonical(binExpr.right)})`;
        case 'paren':
            return canonical((e as ParenExpr).argument);
    }
}

function splitCoeff(term: Expr): { coeff: number; factors: Expr[] } {
    let coeff = 1;
    const out: Expr[] = [];
    for (const f of asProd(term)) {
        if (f.type === 'number') {
            coeff *= (f as NumberExpr).value;
            continue;
        }
        if (f.type === 'neg') {
            coeff *= -1;
            out.push(...asProd((f as NegExpr).argument));
            continue;
        }
        out.push(f);
    }
    out.sort((a, b) => canonical(a).localeCompare(canonical(b)));
    return { coeff, factors: out };
}

function buildProduct(coeff: number, factors: Expr[]): Expr {
    if (coeff === 0) return num(0);

    const sign = coeff < 0 ? -1 : 1;
    const absCoeff = Math.abs(coeff);

    let acc: Expr | null = null;
    if (absCoeff !== 1 || factors.length === 0) acc = num(absCoeff);
    for (const f of factors) acc = acc ? mul(acc, f) : f;

    return sign === -1 ? neg(acc!) : acc!;
}

function takeNeg(e: Expr): { neg: boolean; body: Expr } {
    if (e.type === 'neg') return { neg: true, body: (e as NegExpr).argument };
    if (e.type === 'number' && (e as NumberExpr).value < 0) return { neg: true, body: num(-(e as NumberExpr).value) };
    return { neg: false, body: e };
}

function combineSum(e: Expr): Expr {
    const terms = asSum(e).map(simplify);
    const buckets = new Map<string, { coeff: number; factors: Expr[] }>();

    for (const t of terms) {
        const { coeff, factors } = splitCoeff(t);
        if (coeff === 0) continue;
        const key = factors.length === 0 ? "__CONST__" : factors.map(canonical).join("*");
        const prev = buckets.get(key) ?? { coeff: 0, factors };
        prev.coeff += coeff;
        buckets.set(key, prev);
    }

    const rebuilt: Expr[] = [];
    for (const { coeff, factors } of buckets.values()) {
        if (coeff === 0) continue;
        rebuilt.push(buildProduct(coeff, factors));
    }

    if (rebuilt.length === 0) return num(0);
    if (rebuilt.length === 1) return rebuilt[0];

    let acc = rebuilt[0];
    for (let i = 1; i < rebuilt.length; i++) {
        const t = rebuilt[i];
        const { neg: isNeg, body } = takeNeg(t);
        acc = isNeg ? sub(acc, body) : add(acc, t);
    }
    return acc;
}

function simplify(e: Expr): Expr {
    switch (e.type) {
        case 'number':
        case 'variable':
            return e;

        case 'neg':
            return neg(simplify((e as NegExpr).argument));

        case 'paren':
            return simplify((e as ParenExpr).argument);

        case 'add':
        case 'sub':
        case 'mul':
        case 'div': {
            const binExpr = e as AddExpr | SubExpr | MulExpr | DivExpr;
            const L = simplify(binExpr.left);
            const R = simplify(binExpr.right);

            const base = bin(
                e.type === 'add' ? '+' : e.type === 'sub' ? '-' : e.type === 'mul' ? '*' : '/',
                L,
                R
            );

            if (base.type === 'div') {
                const divExpr = base as DivExpr;
                if (divExpr.right.type === 'mul') {
                    return {
                        type: 'div',
                        left: divExpr.left,
                        right: {
                            type: 'paren',
                            argument: divExpr.right
                        }
                    };
                }
                return base;
            }

            if (base.type === 'mul') {
                if (isSum(L)) {
                    const parts = asSum(L).map(t => simplify(mul(t, R)));
                    return combineSum(parts.slice(1).reduce((acc, t) => add(acc, t), parts[0]));
                }
                if (isSum(R)) {
                    const parts = asSum(R).map(t => simplify(mul(L, t)));
                    return combineSum(parts.slice(1).reduce((acc, t) => add(acc, t), parts[0]));
                }
                return base;
            }

            if (base.type === 'add' || base.type === 'sub') {
                return combineSum(base);
            }

            return base;
        }
    }
}

export function derive(e: Expr, varName: string): Expr {
    const res = (function go(node: Expr): Expr {
        switch (node.type) {
            case 'number':
                return num(0);

            case 'variable':
                return (node as VariableExpr).name === varName ? num(1) : num(0);

            case 'neg':
                return neg(go((node as NegExpr).argument));

            case 'paren':
                return go((node as ParenExpr).argument);

            case 'add':
            case 'sub':
            case 'mul':
            case 'div': {
                const binNode = node as AddExpr | SubExpr | MulExpr | DivExpr;
                const dl = go(binNode.left);
                const dr = go(binNode.right);

                switch (node.type) {
                    case 'add': return add(dl, dr);
                    case 'sub': return sub(dl, dr);
                    case 'mul': return add(mul(dl, binNode.right), mul(binNode.left, dr));
                    case 'div': {
                        const numerator = sub(mul(dl, binNode.right), mul(binNode.left, dr));
                        const denominator = mul(binNode.right, binNode.right);
                        return {
                            type: 'div',
                            left: numerator,
                            right: {
                                type: 'paren',
                                argument: denominator
                            }
                        };
                    }
                }
            }
        }
    })(e);

    return simplify(res);
}