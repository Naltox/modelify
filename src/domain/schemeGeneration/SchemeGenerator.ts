import {SchemeSource} from "./SchemeSource";
import ClassScheme from "../schema/schema/ClassScheme";

export abstract class SchemeGenerator {
    public abstract generate(source: SchemeSource): ClassScheme[]
}