

import { Parser } from "json2csv";

export const convertToCSV = (data) => {
    const fields = [
        "id",
        "title",
        "publishYear",
        "author",
        "subjects"
    ];

    const parser = new Parser({
        fields
    });

    return parser.parse(data);
};

