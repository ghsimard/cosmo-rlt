"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const pdfGenerator_1 = require("./pdf-modules/pdfGenerator");
// Sample school name for testing
const schoolName = 'Institución Educativa Diego Echavarria Misas';
function testPdfGeneration() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Testing PDF generation for school: ${schoolName}`);
        try {
            // Generate the PDF
            const doc = yield (0, pdfGenerator_1.generatePDF)(schoolName);
            // Write to a file
            const outputFile = 'test-report.pdf';
            const writeStream = fs_1.default.createWriteStream(outputFile);
            // Pipe the PDF to the file
            doc.pipe(writeStream);
            // Handle stream events
            writeStream.on('finish', () => {
                console.log(`PDF successfully written to ${outputFile}`);
            });
            writeStream.on('error', (err) => {
                console.error('Error writing PDF:', err);
            });
            // Finalize the PDF
            doc.end();
        }
        catch (error) {
            console.error('Error in test function:', error);
        }
    });
}
// Execute the test
testPdfGeneration();
