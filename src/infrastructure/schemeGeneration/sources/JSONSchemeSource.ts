import {SchemeSource} from "../../../domain/schemeGeneration/SchemeSource";

export default class JSONSchemeSource implements SchemeSource {
    constructor(
        readonly jsonData: object
    ) {

    }
}