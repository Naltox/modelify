import SourceCode from "./SourceCode";

export default class SourceFile {
    constructor(
        readonly fileName: string,
        readonly code: SourceCode
    ) {

    }
}