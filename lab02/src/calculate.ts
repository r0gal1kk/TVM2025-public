import { ReversePolishNotationActionDict } from "./rpn.ohm-bundle";
import { Node, NonterminalNode, IterationNode, TerminalNode } from "ohm-js";

export const rpnCalc = {
    Exp(this: NonterminalNode, arg0: NonterminalNode) {
        return arg0.calculate();
    },
    Exp_sum(this: NonterminalNode, arg0: NonterminalNode, arg1: NonterminalNode, _arg2: TerminalNode) {
        return arg0.calculate() + arg1.calculate();
    },
    Exp_mul(this: NonterminalNode, arg0: NonterminalNode, arg1: NonterminalNode, _arg2: TerminalNode) {
        return arg0.calculate() * arg1.calculate();
    },
    number(this: NonterminalNode, digits: IterationNode) {
        return parseInt(digits.sourceString, 10);
    },
} satisfies ReversePolishNotationActionDict<number>;