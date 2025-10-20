import { MatchResult } from 'ohm-js';
import { arithGrammar, ArithmeticActionDict, ArithmeticSemantics, SyntaxError } from '../../lab03';
import { Expr, NumberExpr, VariableExpr, AddExpr, SubExpr, MulExpr, DivExpr, NegExpr, ParenExpr } from './ast';

export const getExprAst: ArithmeticActionDict<Expr> = {
    number_number(numNode: any): NumberExpr {
        return {
            type: 'number',
            value: parseInt(numNode.sourceString)
        };
    },

    number_variable(varNode: any): VariableExpr {
        return {
            type: 'variable',
            name: varNode.sourceString
        };
    },

    Sum(sumNode: any): Expr {
        const children = sumNode.asIteration().children;
        return children.slice(1).reduce(
            (left: Expr, child: any) => ({
                type: 'add',
                left,
                right: child.parse()
            } as AddExpr),
            children[0].parse()
        );
    },

    Sub(subNode: any): Expr {
        const children = subNode.asIteration().children;
        return children.slice(1).reduce(
            (left: Expr, child: any) => ({
                type: 'sub',
                left,
                right: child.parse()
            } as SubExpr),
            children[0].parse()
        );
    },

    Mul(mulNode: any): Expr {
        const children = mulNode.asIteration().children;
        return children.slice(1).reduce(
            (left: Expr, child: any) => ({
                type: 'mul',
                left,
                right: child.parse()
            } as MulExpr),
            children[0].parse()
        );
    },

    Div(divNode: any): Expr {
        const children = divNode.asIteration().children;
        return children.slice(1).reduce(
            (left: Expr, child: any) => ({
                type: 'div',
                left,
                right: child.parse()
            } as DivExpr),
            children[0].parse()
        );
    },

    Primary_parenthesis(_left: any, expr: any, _right: any): ParenExpr {
        return {
            type: 'paren',
            argument: expr.parse()
        };
    },

    Primary_unaryMin(_minus: any, expr: any): NegExpr {
        return {
            type: 'neg',
            argument: expr.parse()
        };
    }
};

export const semantics = arithGrammar.createSemantics();
semantics.addOperation("parse()", getExprAst);

export interface ArithSemanticsExt extends ArithmeticSemantics {
    (match: MatchResult): ArithActionsExt;
}

export interface ArithActionsExt {
    parse(): Expr;
}

export function parseExpr(source: string): Expr {
    const match = arithGrammar.match(source);
    if (match.failed()) {
        throw new SyntaxError(match.message);
    }
    return semantics(match).parse();
}