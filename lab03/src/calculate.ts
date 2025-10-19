import {MatchResult, Node, NonterminalNode} from "ohm-js";
import grammar, {ArithmeticActionDict, ArithmeticSemantics} from "./arith.ohm-bundle";

export const arithSemantics: ArithSemantics = grammar.createSemantics() as ArithSemantics;

const arithCalc = {
    number_number(numNode: any): number {
        return Number(numNode.sourceString);
    },

    number_variable(varNode: Node): number {
        const varName = varNode.sourceString;
        const value = this.args.params[varName];
        return value !== undefined ? value : NaN;
    },

    Sum(sumNode: NonterminalNode): number {
        return sumNode.asIteration().children.reduce(
            (acc, c) => acc + c.calculate(this.args.params),
            0);
        //
        // let total = 0;
        // for (const child of children) {
        //     total = total + child.calculate(this.args.params);
        // }
        // return total;
    },

    Mul(mulNode: any): number {
        const factors = mulNode.asIteration().children;
        let product = 1;
        for (const factor of factors) {
            product = product * factor.calculate(this.args.params);
        }
        return product;
    },

    Div(divNode: any): number {
        const operands = divNode.asIteration().children;
        let quotient = operands[0].calculate(this.args.params);
        for (let i = 1; i < operands.length; i++) {
            const divisor = operands[i].calculate(this.args.params);
            if (divisor === 0) throw new Error("Division by zero");
            quotient = quotient / divisor;
        }
        return quotient;
    },

    Sub(subNode: any): number {
        const terms = subNode.asIteration().children;
        let difference = terms[0].calculate(this.args.params);
        for (let i = 1; i < terms.length; i++) {
            difference = difference - terms[i].calculate(this.args.params);
        }
        return difference;
    },

    Primary_parenthesis(_left: any, content: any, _right: any): number {
        return content.calculate(this.args.params);
    },

    Primary_unaryMin(_minus: any, operand: any): number {
        const value = operand.calculate(this.args.params);
        return -value;
    },
} satisfies ArithmeticActionDict<number>;

arithSemantics.addOperation<number>("calculate(params)", arithCalc);

export interface ArithActions {
    calculate(params: { [name: string]: number }): number;
}

export interface ArithSemantics extends ArithmeticSemantics {
    (match: MatchResult): ArithActions;
}