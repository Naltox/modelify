import ClassScheme from "../schema/schema/ClassScheme";
import SourceCode from "./SourceCode";
import ApiMethodScheme from "../schema/schema/ApiMethodScheme";
import SourceFile from "./SourceFile";

export interface CodeGenerator {
    generateClass(scheme: ClassScheme): SourceFile

    //generateApiMethod(scheme: ApiMethodScheme): SourceCode

    //generateApiMethodParamsInterface(scheme: ApiMethodScheme): SourceCode
}