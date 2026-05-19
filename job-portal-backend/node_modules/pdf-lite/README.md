**[Examples](./EXAMPLES.md)** | **[Documentation](https://jacobshirley.github.io/pdf-lite/v1)**

# pdf-lite

A low-level, minimal-dependency, type-safe PDF library that works in the browser and Node.js.

> **Note**: This library is actively developed and may not support all PDF features yet. However, it is designed to be extensible and can be improved over time. I would also not expect the API to be stable until at least version 2.0 as a lot of features are still being added and the API is evolving.

PRs and issues are welcome!

[![npm version](https://img.shields.io/npm/v/pdf-lite.svg)](https://www.npmjs.com/package/pdf-lite)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Type-safe**: Built with TypeScript, ensuring type safety and reducing runtime errors.
- **Browser and Node.js support**: Works seamlessly in both environments, allowing for versatile usage.
- **Low-level API**: Provides a low-level API for advanced users who want to manipulate PDF files directly, as well as a higher-level API for easier usage.
- **Minimal dependencies**: A small number external libraries are required, making it lightweight and easy to integrate.

## Installation

```bash
npm install pdf-lite
yarn add pdf-lite
pnpm add pdf-lite
```

## Usage

The library provides both low-level and high-level APIs for working with PDF documents. See [PDF Support](#pdf-support) for a list of supported features.

### Reading a PDF

```typescript
import { PdfReader } from 'pdf-lite/pdf/pdf-reader'
import { readFile } from 'fs/promises'

const pdfBytes = await readFile('document.pdf')
const doc = await PdfReader.fromBytes([pdfBytes])
```

### Creating a PDF from Scratch

```typescript
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'

// Create the document
const doc = new PdfDocument()

// Create content stream
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: 'BT /F1 24 Tf 100 700 Td (Hello, PDF-Lite!) Tj ET',
    }),
})

// Create and add objects
doc.add(contentStream)
// ... create pages, catalog, etc.

// Output the PDF
console.log(doc.toString())
```

### Working with Encryption

```typescript
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { PdfV2SecurityHandler } from 'pdf-lite/security/handlers/v2'

const document = new PdfDocument()
// ... build your PDF structure

// Set up encryption
document.securityHandler = new PdfV2SecurityHandler({
    password: 'user-password',
    documentId: 'unique-doc-id',
    encryptMetadata: true,
})

// Encrypt the document
await document.encrypt()

console.log(document.toString())
```

### Filling AcroForms

```typescript
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { readFile, writeFile } from 'fs/promises'

const pdfBytes = await readFile('form.pdf')
const doc = await PdfDocument.fromBytes([pdfBytes])

const form = doc.acroform
if (!form) throw new Error('No AcroForm found')

// Set multiple field values at once
form.setValues({
    name: 'John Doe',
    email: 'john@example.com',
    subscribe: 'Yes', // checkbox: 'Yes' or 'Off'
})

// Or work with individual fields
const field = form.fields.find((f) => f.name === 'name')
if (field) field.value = 'Jane Doe'

// Export all current values
const values = form.exportData()
// => { name: 'Jane Doe', email: 'john@example.com', subscribe: 'Yes' }

await writeFile('filled.pdf', doc.toBytes())
```

### Generating Appearances

Appearance streams control how form fields render visually. The library can automatically generate them when field values are set, or you can generate them manually.

```typescript
import { PdfButtonFormField } from 'pdf-lite/acroform/fields/pdf-button-form-field'
import { PdfChoiceFormField } from 'pdf-lite/acroform/fields/pdf-choice-form-field'
import { PdfAcroForm } from 'pdf-lite/acroform/pdf-acro-form'
import { PdfTextFormField } from 'pdf-lite/acroform/fields/pdf-text-form-field'

declare const form: PdfAcroForm
declare const field: PdfTextFormField

// Auto-generate appearances when setting values (default behavior)
field.value = 'Hello' // appearance is generated automatically

// Or generate manually with options
field.generateAppearance({ makeReadOnly: true })

// Configure font and size for a field
field.fontSize = 14
field.fontName = 'Helv'

// For checkbox fields
const checkbox = form.fields.find(
    (f) => f.name === 'agree',
) as PdfButtonFormField
checkbox.checked = true
checkbox.generateAppearance()

// For choice fields (dropdowns/listboxes)
const dropdown = form.fields.find(
    (f) => f.name === 'country',
) as PdfChoiceFormField
dropdown.value = 'US'
dropdown.generateAppearance()
```

### Working with Fonts

```typescript
import { PdfFont } from 'pdf-lite'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { readFileSync } from 'fs'

// Standard PDF fonts (built into all PDF readers)
const helvetica = PdfFont.fromStandardFont('Helvetica')
const timesBold = PdfFont.fromStandardFont('Times-Bold')
const courier = PdfFont.fromStandardFont('Courier')

// Embed custom fonts from file bytes (auto-detects TTF, OTF, WOFF)
const fontData = readFileSync('MyFont.ttf')
const customFont = PdfFont.fromBytes(fontData)

// Use pre-defined font constants
const font = PdfFont.HELVETICA_BOLD

// Assign resource names for use in content streams
customFont.resourceName = 'F1'

// Add to document
const doc = new PdfDocument()
doc.add(customFont)
```

**Standard font names:** Helvetica, Helvetica-Bold, Helvetica-Oblique, Helvetica-BoldOblique, Times-Roman, Times-Bold, Times-Italic, Times-BoldItalic, Courier, Courier-Bold, Courier-Oblique, Courier-BoldOblique, Symbol, ZapfDingbats

### Signing PDFs

```typescript
import {
    PdfAdbePkcs7DetachedSignatureObject,
    PdfEtsiCadesDetachedSignatureObject,
} from 'pdf-lite'

// See examples directory for complete signing implementations
```

For more detailed examples, see the [EXAMPLES.md](EXAMPLES.md) file and the [examples/](examples/) directory.

## PDF Support

### Low-level PDF constructs

Provides access to low-level PDF constructs, allowing for advanced manipulation and customization of PDF documents.

- [x] PDF numbers
- [x] PDF strings
- [x] PDF arrays
- [x] PDF dictionaries
- [x] PDF streams
- [x] PDF null
- [x] PDF booleans
- [x] PDF object references
- [x] PDF name objects
- [x] PDF indirect objects
- [x] PDF comments
- [x] PDF trailer
- [x] PDF object streams
- [x] PDF xref streams
- [x] PDF xref tables

### Encryption

Supports encrypting and decrypting PDF files using standard algorithms, ensuring document security. Implements a password recovery feature for encrypted PDFs, allowing users to regain access to their documents.

**Encryption algorithms supported:**

- [x] RC4-40
- [x] RC4-128
- [x] AES-128
- [x] AES-256

**Encryption methods:**

- [x] Password-based encryption
- [x] Certificate-based encryption (public key)

### Compression

Handles various compression algorithms, including Flate, LZW, and RunLength for efficient file size management. Note: image compression such as JPEG is not supported.

**Compression algorithms supported:**

- [x] Flate
- [x] LZW
- [x] ASCII85
- [x] ASCIIHex
- [x] RunLength

### Signing

PDF Signatures are powered by the [pki-lite](https://www.npmjs.com/package/pki-lite) library.

Provides support for digitally signing PDF documents, ensuring authenticity and integrity. All signing functionality is integrated into the main `pdf-lite` package.

**Signing algorithms supported:**

- [x] RSA
- [x] ECDSA

**Signature types supported:**

- [x] adbe.pkcs7.detached
- [x] adbe.pkcs7.sha1
- [x] adbe.x509.rsa_sha1
- [x] ETSI.CAdES.detached
- [x] ETSI.RFC3161

**LTV support/Revocation Info/Document Security Store (DSS):**

Long-Term Validation (LTV) support ensures that digital signatures remain valid over time, even after the signing certificate has expired. To enable this, the Document Security Store (DSS) is used to store revocation information and other metadata related to the signature.

- [x] DSS (Document Security Store)
- [x] CRL (Certificate Revocation List)
- [x] OCSP (Online Certificate Status Protocol)

**Other features:**

- [x] Timestamping
- [x] Verification of existing signatures

### AcroForms

Supports reading, filling, and creating AcroForm fields within PDF documents.

**Field types:**

- [x] Text fields (single-line, multi-line, comb, password)
- [x] Checkboxes
- [x] Radio buttons
- [x] Dropdowns (combo boxes)
- [x] List boxes
- [x] Signature fields

**Form operations:**

- [x] Import/export field values (`importData`, `exportData`, `setValues`)
- [x] Read individual field properties (name, value, type, flags)
- [x] Hierarchical field support (parent/child/sibling fields)

**JavaScript actions:**

- [x] JavaScript action execution via `PdfJavaScriptEngine`
- [x] Validate, keystroke, calculate, and format action triggers
- [x] Built-in Acrobat JS functions: `util.printd`, `util.scand`, `util.printf`
- [x] `AFNumber_Format` / `AFNumber_Keystroke` — number formatting and validation
- [x] `AFDate_FormatEx` / `AFDate_KeystrokeEx` — date formatting and validation
- [x] `AFSimple_Calculate` — SUM, AVG, PRD, MIN, MAX across fields
- [x] `AFSpecial_Format` / `AFSpecial_Keystroke` — zip, SSN, phone formatting

### Appearance Streams

Automatic generation of visual appearance streams for form fields, so filled forms render correctly in all PDF viewers without relying on `NeedAppearances`.

- [x] Text field rendering (word wrap, auto-sizing, comb layout)
- [x] Checkbox/radio button rendering
- [x] Dropdown/list box rendering
- [x] Font resolution from field, form, or document resources
- [x] Auto-size font (fontSize=0) for single-line text fields
- [x] Custom font color via Default Appearance strings

### Fonts

Supports standard PDF fonts and embedding custom fonts.

- [x] All 14 standard PDF fonts (Helvetica, Times, Courier, Symbol, ZapfDingbats + variants)
- [x] TrueType font embedding (TTF)
- [x] OpenType font embedding (OTF, non-CFF)
- [x] WOFF font embedding
- [x] Auto-detect font format via `PdfFont.fromBytes()`
- [x] Font encoding maps (WinAnsi, Unicode/Identity-H)
- [x] Character width metrics

### XFA Forms

You can read/write XFA XML data from PDFs, but rendering and filling XFA forms is not supported.

- [x] Read XFA XML
- [x] Write XFA XML

## Future Plans

- **Writing Linearized PDF**: Writing linearized PDFs for faster web viewing, improving user experience when accessing documents online.

## Development

This project uses pnpm for package management.

### Setup

```bash
pnpm install
```

### Building

```bash
pnpm compile
```

### Testing

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run acceptance tests
pnpm test:acceptance
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## API Reference

See the [documentation folder](./docs/README.md) or the document site for a complete API reference.

## License

MIT License - see [LICENSE](LICENSE) for details.
