import { Expr } from "./ast";

const PRECEDENCE = {
    'neg': 4,
    'mul': 3,
    'div': 3,
    'add': 2,
    'sub': 2,
    'number': 0,
    'variable': 0
} as const;

function needsParens(child: Expr, parentPrecedence: number, isRight: boolean = false, parentType?: string): boolean {
    if (child.type === 'paren') {
        return needsParens(child.argument, parentPrecedence, isRight, parentType);
    }

    const childPrecedence = PRECEDENCE[child.type];

    if (childPrecedence < parentPrecedence) {
        return true;
    }

    if (childPrecedence === parentPrecedence) {
        // Для правых операндов всегда нужны скобки при равных приоритетах
        if (isRight) {
            // Убираем скобки только для ассоциативных операций (add, mul)
            return !((child.type === 'add' || child.type === 'mul') &&
                (child.type === parentType));
        }
    }

    return false;
}

function printExprWithPrecedence(e: Expr, parentPrecedence: number = 0, isRight: boolean = false, parentType?: string): string {
    if (e.type === 'paren') {
        return printExprWithPrecedence(e.argument, parentPrecedence, isRight, parentType);
    }

    const currentPrecedence = PRECEDENCE[e.type];

    switch (e.type) {
        case 'number':
            return e.value.toString();

        case 'variable':
            return e.name;

        case 'add':
        case 'sub':
        case 'mul':
        case 'div':
            const leftStr = printExprWithPrecedence(e.left, currentPrecedence, false, e.type);
            const rightStr = printExprWithPrecedence(e.right, currentPrecedence, true, e.type);
            const operator =
                e.type === 'add' ? '+' :
                    e.type === 'sub' ? '-' :
                        e.type === 'mul' ? '*' : '/';

            const result = `${leftStr} ${operator} ${rightStr}`;

            return needsParens(e, parentPrecedence, isRight, parentType) ? `(${result})` : result;

        case 'neg':
            const argStr = printExprWithPrecedence(e.argument, currentPrecedence);
            const argNeedsParens = e.argument.type === 'add' || e.argument.type === 'sub';
            return argNeedsParens ? `-(${argStr})` : `-${argStr}`;
    }
}

export function printExpr(e: Expr): string {
    return printExprWithPrecedence(e);
}