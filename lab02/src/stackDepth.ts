import { ReversePolishNotationActionDict } from "./rpn.ohm-bundle";
import { Node, NonterminalNode, IterationNode, TerminalNode } from "ohm-js";

export type StackDepth = { max: number, out: number };

export const rpnStackDepth = {
    Exp(this: NonterminalNode, _arg0: NonterminalNode) {
        return _arg0.stackDepth;
    },
    Exp_sum(this: NonterminalNode, arg0: NonterminalNode, arg1: NonterminalNode, _arg2: TerminalNode) {
        const depth1 = arg0.stackDepth;
        const depth2 = arg1.stackDepth;
        const maxDepth = Math.max(depth1.max, depth1.out + depth2.max);
        return { max: maxDepth, out: depth1.out + depth2.out - 1 };
    },
    Exp_mul(this: NonterminalNode, arg0: NonterminalNode, arg1: NonterminalNode, _arg2: TerminalNode) {
        const depth1 = arg0.stackDepth;
        const depth2 = arg1.stackDepth;
        const maxDepth = Math.max(depth1.max, depth1.out + depth2.max);
        return { max: maxDepth, out: depth1.out + depth2.out - 1 };
    },
    number(this: NonterminalNode, _digits: IterationNode) {
        return { max: 1, out: 1 };
    },
} satisfies ReversePolishNotationActionDict<StackDepth>;