import {
    importBooks,
    validateImportSize
} from "../services/importService.js";


/*
=====================================================
IMPORT BOOKS
=====================================================
*/

export const startBookImport = async (
    req,
    res,
    next
) => {
    try {
        const {
            count
        } = req.body;

        /*
        ---------------------------------------------
        Validate count
        ---------------------------------------------
        */

        const importCount =
            validateImportSize(count);

        console.log(
            `Starting import of ${importCount} books`
        );

        /*
        ---------------------------------------------
        Import
        ---------------------------------------------
        */

        const result =
            await importBooks(
                importCount
            );

        /*
        ---------------------------------------------
        Response
        ---------------------------------------------
        */

        res.status(200).json({
            success: true,

            message:
                `Book import completed for ${importCount} books`,

            data: result
        });
    } catch (error) {
        next(error);
    }
};