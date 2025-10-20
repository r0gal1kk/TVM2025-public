export interface NumberExpr {
    type: 'number';
    value: number;
}

export interface VariableExpr {
    type: 'variable';
    name: string;
}

export interface AddExpr {
    type: 'add';
    left: Expr;
    right: Expr;
}

export interface SubExpr {
    type: 'sub';
    left: Expr;
    right: Expr;
}

export interface MulExpr {
    type: 'mul';
    left: Expr;
    right: Expr;
}

export interface DivExpr {
    type: 'div';
    left: Expr;
    right: Expr;
}

export interface NegExpr {
    type: 'neg';
    argument: Expr;
}

export interface ParenExpr {
    type: 'paren';
    argument: Expr;
}

export type Expr =
    | NumberExpr
    | VariableExpr
    | AddExpr
    | SubExpr
    | MulExpr
    | DivExpr
    | NegExpr
    | ParenExpr;