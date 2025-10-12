import { Dict, MatchResult, Semantics } from "ohm-js";
import grammar, { AddMulActionDict } from "./addmul.ohm-bundle";

export const addMulSemantics: AddMulSemantics = grammar.createSemantics() as AddMulSemantics;


const addMulCalc = {
    Expr(expr) {
      return expr.calculate();
    },
    AddExpr(firstNumber, ops, otherNumbers) {
      let sum = firstNumber.calculate();
      for (let i = 0; i < ops.numChildren; i++) {
          let nextNumber = otherNumbers.child(i);
          sum += nextNumber.calculate();
      }
      return sum;
    },
    MulExpr(firstNumber, ops, otherNumbers) {
        let product = firstNumber.calculate();
        for (let i = 0; i < ops.numChildren; i++) {
            product *= otherNumbers.child(i).calculate();
        }
        return product;
    },
    PrimaryExpr(_open, expr, _close) {
        return expr.calculate();
    },
    number(chars) {
        return parseInt(this.sourceString);
    }
} satisfies AddMulActionDict<number>

addMulSemantics.addOperation<Number>("calculate()", addMulCalc);

interface AddMulDict  extends Dict {
    calculate(): number;
}

interface AddMulSemantics extends Semantics
{
    (match: MatchResult): AddMulDict;
}
