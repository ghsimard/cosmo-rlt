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
exports.generatePDF = generatePDF;
const pdfkit_1 = __importDefault(require("pdfkit"));
const coverPage_1 = require("./coverPage");
const explanatoryPage1_1 = require("./explanatoryPage1");
const explanatoryPage2_1 = require("./explanatoryPage2");
const encuestadosPage_1 = require("./encuestadosPage");
const summaryPage_1 = require("./summaryPage");
const fortalezasPages_1 = require("./fortalezasPages");
/**
 * Generates a complete school environment survey PDF report
 * @param school School name to filter data
 * @returns The generated PDF document
 */
function generatePDF(school) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create a new PDF document with proper formatting
        const doc = new pdfkit_1.default({
            autoFirstPage: false,
            margins: {
                top: 50,
                bottom: 50,
                left: 50,
                right: 50
            },
            size: 'A4'
        });
        console.log(`Generating PDF for school: ${school || 'All schools'}`);
        try {
            // Generate each page separately in sequence
            yield (0, coverPage_1.generateCoverPage)(doc, school);
            (0, explanatoryPage1_1.generateExplanatoryPage1)(doc);
            (0, explanatoryPage2_1.generateExplanatoryPage2)(doc);
            // Handle school parameter for pages that require it
            if (school) {
                yield (0, encuestadosPage_1.generateEncuestadosPage)(doc, school);
                yield (0, summaryPage_1.generateSummaryPage)(doc, school);
                yield (0, fortalezasPages_1.generateFortalezasPages)(doc, school);
            }
            else {
                // Handle case where no school is specified
                doc.addPage();
                doc.fontSize(14)
                    .fillColor('black')
                    .text('No school specified. Please select a school to view detailed data.', 100, 100);
            }
            console.log('PDF generation completed successfully');
        }
        catch (error) {
            console.error('Error generating PDF:', error);
            // Add an error page if there was a problem
            doc.addPage();
            doc.fontSize(20)
                .fillColor('red')
                .text('Error generating PDF report', 100, 100)
                .fontSize(12)
                .fillColor('black')
                .moveDown()
                .text(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return doc;
    });
}
