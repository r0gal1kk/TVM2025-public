import { Dict, MatchResult, Semantics } from "ohm-js";
import grammar, { AddMulActionDict } from "./addmul.ohm-bundle";

export const addMulSemantics: AddMulSemantics = grammar.createSemantics() as AddMulSemantics;


const addMulCalc = {
    Expr(expr) {
      return expr.calculate();
    },
    AddExpr(firstNumber, pluses, otherNumbers) {
      let sum = firstNumber.calculate();
      for (let i = 0; i < pluses.numChildren; i++) {
          let nextNumber = otherNumbers.child(i);
          sum += nextNumber.calculate();
      }
      return sum;
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
