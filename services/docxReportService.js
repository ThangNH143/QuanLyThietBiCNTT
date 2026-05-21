// services/docxReportService.js

import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const execFileAsync = promisify(execFile);

const DEFAULT_SOFFICE_PATH = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

export async function renderDocxTemplateToPdf({
  templatePath,
  outputDir,
  data,
  outputBaseName
}) {
  ensureDirectoryExists(outputDir);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Không tìm thấy file template: ${templatePath}`);
  }

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: {
      start: '{{',
      end: '}}'
    }
  });

  doc.render(data);

  const docxBuffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  });

  const docxOutputPath = path.join(outputDir, `${outputBaseName}.docx`);
  const pdfOutputPath = path.join(outputDir, `${outputBaseName}.pdf`);

  fs.writeFileSync(docxOutputPath, docxBuffer);

  await convertDocxToPdfWithLibreOffice(docxOutputPath, outputDir);

  if (!fs.existsSync(pdfOutputPath)) {
    throw new Error(`LibreOffice không tạo được file PDF: ${pdfOutputPath}`);
  }

  const pdfBuffer = fs.readFileSync(pdfOutputPath);

  return {
    docxOutputPath,
    pdfOutputPath,
    pdfBuffer
  };
}

async function convertDocxToPdfWithLibreOffice(docxPath, outputDir) {
  const sofficePath = process.env.LIBREOFFICE_PATH || DEFAULT_SOFFICE_PATH;

  if (!fs.existsSync(sofficePath)) {
    throw new Error(
      `Không tìm thấy LibreOffice tại: ${sofficePath}. ` +
      `Hãy cài LibreOffice hoặc set biến môi trường LIBREOFFICE_PATH.`
    );
  }

  await execFileAsync(sofficePath, [
    '--headless',
    '--convert-to',
    'pdf',
    '--outdir',
    outputDir,
    docxPath
  ], {
    windowsHide: true
  });
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {
      recursive: true
    });
  }
}