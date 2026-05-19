# PDF-Lite Examples

This directory contains example scripts demonstrating how to use the PDF-Lite library.

## PDF creation from scratch example

```typescript
import { writeFileSync } from 'fs'
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { PdfPage } from 'pdf-lite/pdf/pdf-page'
import { PdfPages } from 'pdf-lite/pdf/pdf-pages'

function createCatalog(
    pagesRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const catalogDict = new PdfDictionary()
    catalogDict.set('Type', new PdfName('Catalog'))
    catalogDict.set('Pages', pagesRef)
    return new PdfIndirectObject({ content: catalogDict })
}

function createFont(): PdfIndirectObject<PdfDictionary> {
    const fontDict = new PdfDictionary()
    fontDict.set('Type', new PdfName('Font'))
    fontDict.set('Subtype', new PdfName('Type1'))
    fontDict.set('BaseFont', new PdfName('Helvetica'))
    return new PdfIndirectObject({ content: fontDict })
}

function createResources(
    fontRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const resourcesDict = new PdfDictionary()
    const fontDict = new PdfDictionary()
    fontDict.set('F1', fontRef)
    resourcesDict.set('Font', fontDict)
    return new PdfIndirectObject({ content: resourcesDict })
}

// Create the document
const document = new PdfDocument()

// Create font
const font = createFont()
document.add(font)

// Create resources with the font
const resources = createResources(font.reference)
document.add(resources)

// Create content stream
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: 'BT /F1 24 Tf 100 700 Td (Hello, PDF-Lite!) Tj ET',
    }),
})

// Create a page using PdfPage
const page = new PdfPage()
page.mediaBox = [0, 0, 612, 792]
page.contents = contentStream.reference
page.resources = resources.reference
document.add(page)

// Create pages collection using PdfPages
const pages = new PdfPages()
pages.kids = new PdfArray([page.reference])
pages.count = 1
page.parent = pages
document.add(pages)

// Create catalog
const catalog = createCatalog(pages.reference)
document.add(catalog)

// Set the catalog as the root
document.trailerDict.set('Root', catalog.reference)

document.add(contentStream)
await document.finalize()

const file = `${import.meta.dirname}/tmp/created.pdf`
console.log(`Writing PDF to: ${file}`)

await writeFileSync(`${file}`, document.toBytes())
```

## PDF creation with encryption example

```typescript
import { writeFileSync } from 'fs'
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { PdfV2SecurityHandler } from 'pdf-lite/security/handlers/v2'

function createPage(
    contentStreamRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const pageDict = new PdfDictionary()
    pageDict.set('Type', new PdfName('Page'))
    pageDict.set(
        'MediaBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(612),
            new PdfNumber(792),
        ]),
    )
    pageDict.set('Contents', contentStreamRef)
    return new PdfIndirectObject({ content: pageDict })
}

function createPages(
    pages: PdfIndirectObject<PdfDictionary>[],
): PdfIndirectObject<PdfDictionary> {
    const pagesDict = new PdfDictionary()
    pagesDict.set('Type', new PdfName('Pages'))
    pagesDict.set('Kids', new PdfArray(pages.map((x) => x.reference)))
    pagesDict.set('Count', new PdfNumber(pages.length))
    return new PdfIndirectObject({ content: pagesDict })
}

function createCatalog(
    pagesRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const catalogDict = new PdfDictionary()
    catalogDict.set('Type', new PdfName('Catalog'))
    catalogDict.set('Pages', pagesRef)
    return new PdfIndirectObject({ content: catalogDict })
}

function createFont(): PdfIndirectObject<PdfDictionary> {
    const fontDict = new PdfDictionary()
    fontDict.set('Type', new PdfName('Font'))
    fontDict.set('Subtype', new PdfName('Type1'))
    fontDict.set('BaseFont', new PdfName('Helvetica'))
    return new PdfIndirectObject({ content: fontDict })
}

function createResources(
    fontRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const resourcesDict = new PdfDictionary()
    const fontDict = new PdfDictionary()
    fontDict.set('F1', fontRef)
    resourcesDict.set('Font', fontDict)
    return new PdfIndirectObject({ content: resourcesDict })
}

// Create the document
const document = new PdfDocument()

// Create font
const font = createFont()
document.add(font)

// Create resources with the font
const resources = createResources(font.reference)
document.add(resources)

// Create content stream
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: 'BT /F1 24 Tf 100 700 Td (Hello, PDF-Lite!) Tj ET',
    }),
})

// Create a page
const page = createPage(contentStream.reference)
// Add resources to the page
page.content.set('Resources', resources.reference)
document.add(page)

// Create pages collection
const pages = createPages([page])
// Set parent reference for the page
page.content.set('Parent', pages.reference)
document.add(pages)

// Create catalog
const catalog = createCatalog(pages.reference)
document.add(catalog)

// Set the catalog as the root
document.trailerDict.set('Root', catalog.reference)

document.add(contentStream)
await document.finalize()

document.securityHandler = new PdfV2SecurityHandler({
    password: 'up',
    documentId: 'cafebabe',
    encryptMetadata: true,
})

await document.encrypt()

const file = `${import.meta.dirname}/tmp/encrypted.pdf`
console.log(`Writing encrypted PDF to: ${file}. Password: "up"`)

await writeFileSync(`${file}`, document.toBytes())
```

## PDF signature example

```typescript
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { PdfString } from 'pdf-lite/core/objects/pdf-string'
import {
    PdfAdbePkcsX509RsaSha1SignatureObject,
    PdfAdbePkcs7DetachedSignatureObject,
    PdfAdbePkcs7Sha1SignatureObject,
    PdfEtsiCadesDetachedSignatureObject,
    PdfEtsiRfc3161SignatureObject,
} from 'pdf-lite'
import { rsaSigningKeys } from '../packages/pdf-lite/test/unit/fixtures/rsa-2048/index'
import fs from 'fs/promises'

function createPage(
    contentStreamRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const pageDict = new PdfDictionary()
    pageDict.set('Type', new PdfName('Page'))
    pageDict.set(
        'MediaBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(612),
            new PdfNumber(792),
        ]),
    )
    pageDict.set('Contents', contentStreamRef)
    return new PdfIndirectObject({ content: pageDict })
}

function createPages(
    pages: PdfIndirectObject<PdfDictionary>[],
): PdfIndirectObject<PdfDictionary> {
    const pagesDict = new PdfDictionary()
    pagesDict.set('Type', new PdfName('Pages'))
    pagesDict.set('Kids', new PdfArray(pages.map((x) => x.reference)))
    pagesDict.set('Count', new PdfNumber(pages.length))
    return new PdfIndirectObject({ content: pagesDict })
}

function createCatalog(
    pagesRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const catalogDict = new PdfDictionary()
    catalogDict.set('Type', new PdfName('Catalog'))
    catalogDict.set('Pages', pagesRef)
    return new PdfIndirectObject({ content: catalogDict })
}

function createFont(): PdfIndirectObject<PdfDictionary> {
    const fontDict = new PdfDictionary()
    fontDict.set('Type', new PdfName('Font'))
    fontDict.set('Subtype', new PdfName('Type1'))
    fontDict.set('BaseFont', new PdfName('Helvetica'))
    return new PdfIndirectObject({ content: fontDict })
}

function createResources(
    fontRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const resourcesDict = new PdfDictionary()
    const fontDict = new PdfDictionary()
    fontDict.set('F1', fontRef)
    resourcesDict.set('Font', fontDict)
    return new PdfIndirectObject({ content: resourcesDict })
}

function createPageWithSignatureField(
    contentStreamRef: PdfObjectReference,
    signatureAnnotRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const pageDict = new PdfDictionary()
    pageDict.set('Type', new PdfName('Page'))
    pageDict.set(
        'MediaBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(612),
            new PdfNumber(792),
        ]),
    )
    pageDict.set('Contents', contentStreamRef)
    pageDict.set('Annots', new PdfArray([signatureAnnotRef]))

    return new PdfIndirectObject({ content: pageDict })
}

function createSignatureAnnotation(
    signatureRef: PdfObjectReference,
    appearanceStreamRef: PdfObjectReference,
    pageRef: PdfObjectReference,
    signatureName: string,
): PdfIndirectObject<PdfDictionary> {
    const signatureAnnotation = new PdfDictionary()
    signatureAnnotation.set('Type', new PdfName('Annot'))
    signatureAnnotation.set('Subtype', new PdfName('Widget'))
    signatureAnnotation.set('FT', new PdfName('Sig'))
    signatureAnnotation.set('T', new PdfString(signatureName))
    signatureAnnotation.set(
        'Rect',
        new PdfArray([
            new PdfNumber(135), // x1: Start after "Signature: " text (~72 + 63)
            new PdfNumber(640), // y1: Bottom of signature area (652 - 12)
            new PdfNumber(400), // x2: End of signature line
            new PdfNumber(665), // y2: Top of signature area (652 + 13)
        ]),
    )
    signatureAnnotation.set('F', new PdfNumber(4))
    signatureAnnotation.set('P', pageRef) // Reference to parent page
    signatureAnnotation.set('V', signatureRef)

    // Add appearance dictionary
    const appearanceDict = new PdfDictionary()
    appearanceDict.set('N', appearanceStreamRef)
    signatureAnnotation.set('AP', appearanceDict)

    return new PdfIndirectObject({ content: signatureAnnotation })
}

function createSignatureAppearance(): PdfIndirectObject<PdfStream> {
    // Create font for appearance
    const appearanceFont = new PdfDictionary()
    appearanceFont.set('Type', new PdfName('Font'))
    appearanceFont.set('Subtype', new PdfName('Type1'))
    appearanceFont.set('BaseFont', new PdfName('Helvetica'))

    const fontDict = new PdfDictionary()
    fontDict.set('F1', appearanceFont)

    const resourcesDict = new PdfDictionary()
    resourcesDict.set('Font', fontDict)

    // Create appearance stream header
    const appearanceHeader = new PdfDictionary()
    appearanceHeader.set('Type', new PdfName('XObject'))
    appearanceHeader.set('Subtype', new PdfName('Form'))
    appearanceHeader.set(
        'BBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(265), // Width: 400 - 135
            new PdfNumber(25), // Height: 665 - 640
        ]),
    )
    appearanceHeader.set('Resources', resourcesDict)

    // Create appearance stream for the signature
    return new PdfIndirectObject({
        content: new PdfStream({
            header: appearanceHeader,
            original:
                'BT /F1 10 Tf 5 14 Td (Digitally signed by: Jake Shirley) Tj ET',
        }),
    })
}

// Create the document
const document = new PdfDocument()

// Create font
const font = createFont()
document.add(font)

// Create resources with the font
const resources = createResources(font.reference)
document.add(resources)

// Create content stream for first page
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: 'BT /F1 24 Tf 100 700 Td (Hello, PDF-Lite!) Tj ET',
    }),
})
document.add(contentStream)

// Create first page
const page1 = createPage(contentStream.reference)
page1.content.set('Resources', resources.reference)
document.add(page1)

// Array to hold all pages and signature objects
const allPages: PdfIndirectObject<PdfDictionary>[] = [page1]
const allSignatures: any[] = []
const signatureFields: PdfObjectReference[] = []

// Helper function to create a signature page
function createSignaturePage(
    signatureType: string,
    signatureObj: any,
    pageNumber: number,
) {
    const content = new PdfIndirectObject({
        content: new PdfStream({
            header: new PdfDictionary(),
            original: `BT /F1 12 Tf 72 712 Td (Signature Type: ${signatureType}) Tj 0 -60 Td (Signature: ________________________________) Tj ET`,
        }),
    })
    document.add(content)

    const appearance = createSignatureAppearance()
    document.add(appearance)

    // Create page first to get its reference
    const page = createPageWithSignatureField(
        content.reference,
        new PdfObjectReference(0, 0), // Temporary placeholder
    )
    page.content.set('Resources', resources.reference)
    document.add(page)

    // Now create annotation with page reference
    const annotation = createSignatureAnnotation(
        signatureObj.reference,
        appearance.reference,
        page.reference,
        `Signature${pageNumber}`,
    )
    document.add(annotation)

    // Update page's Annots array with actual annotation reference
    page.content.set('Annots', new PdfArray([annotation.reference]))

    signatureFields.push(annotation.reference)
    return page
}

// Page 2: Adobe PKCS7 Detached
const pkcs7DetachedSig = new PdfAdbePkcs7DetachedSignatureObject({
    privateKey: rsaSigningKeys.privateKey,
    certificate: rsaSigningKeys.cert,
    issuerCertificate: rsaSigningKeys.caCert,
    name: 'Jake Shirley',
    location: 'Earth',
    reason: 'PKCS7 Detached Signature',
    contactInfo: 'test@test.com',
    revocationInfo: {
        crls: [rsaSigningKeys.caCrl],
        ocsps: [rsaSigningKeys.ocspResponse],
    },
})
allSignatures.push(pkcs7DetachedSig)
allPages.push(createSignaturePage('Adobe PKCS7 Detached', pkcs7DetachedSig, 2))

// Page 3: Adobe PKCS7 SHA1
const pkcs7Sha1Sig = new PdfAdbePkcs7Sha1SignatureObject({
    privateKey: rsaSigningKeys.privateKey,
    certificate: rsaSigningKeys.cert,
    issuerCertificate: rsaSigningKeys.caCert,
    name: 'Jake Shirley',
    location: 'Earth',
    reason: 'PKCS7 SHA1 Signature',
    contactInfo: 'test@test.com',
})
allSignatures.push(pkcs7Sha1Sig)
allPages.push(createSignaturePage('Adobe PKCS7 SHA1', pkcs7Sha1Sig, 3))

// Page 4: Adobe X509 RSA SHA1
const x509RsaSha1Sig = new PdfAdbePkcsX509RsaSha1SignatureObject({
    privateKey: rsaSigningKeys.privateKey,
    certificate: rsaSigningKeys.cert,
    additionalCertificates: [rsaSigningKeys.caCert],
    name: 'Jake Shirley',
    location: 'Earth',
    reason: 'X509 RSA SHA1 Signature',
    contactInfo: 'test@test.com',
    revocationInfo: {
        crls: [rsaSigningKeys.caCrl],
        ocsps: [rsaSigningKeys.ocspResponse],
    },
})
allSignatures.push(x509RsaSha1Sig)
allPages.push(createSignaturePage('Adobe X509 RSA SHA1', x509RsaSha1Sig, 4))

// Page 5: ETSI CAdES Detached
const cadesDetachedSig = new PdfEtsiCadesDetachedSignatureObject({
    privateKey: rsaSigningKeys.privateKey,
    certificate: rsaSigningKeys.cert,
    issuerCertificate: rsaSigningKeys.caCert,
    name: 'Jake Shirley',
    location: 'Earth',
    reason: 'CAdES Detached Signature',
    contactInfo: 'test@test.com',
    revocationInfo: {
        crls: [rsaSigningKeys.caCrl],
        ocsps: [rsaSigningKeys.ocspResponse],
    },
})
allSignatures.push(cadesDetachedSig)
allPages.push(createSignaturePage('ETSI CAdES Detached', cadesDetachedSig, 5))

// Page 6: ETSI RFC3161 (Timestamp)
const rfc3161Sig = new PdfEtsiRfc3161SignatureObject({
    timeStampAuthority: {
        url: 'https://freetsa.org/tsr',
    },
})
allSignatures.push(rfc3161Sig)
allPages.push(createSignaturePage('ETSI RFC3161 Timestamp', rfc3161Sig, 6))

// Create pages collection with all pages
const pages = createPages(allPages)
// Set parent reference for all pages
allPages.forEach((page) => {
    page.content.set('Parent', pages.reference)
})
document.add(pages)

// Create catalog with AcroForm
const catalog = createCatalog(pages.reference)

// Add AcroForm to catalog with all signature fields
const acroForm = new PdfDictionary()
acroForm.set('Fields', new PdfArray(signatureFields))
acroForm.set('SigFlags', new PdfNumber(3))
const acroFormObj = new PdfIndirectObject({ content: acroForm })
document.add(acroFormObj)
catalog.content.set('AcroForm', acroFormObj.reference)

document.add(catalog)

// Set the catalog as the root
document.trailerDict.set('Root', catalog.reference)

await document.finalize()

const tmpFolder = `${import.meta.dirname}/tmp`
await fs.mkdir(tmpFolder, { recursive: true })
await fs.writeFile(`${tmpFolder}/signed-output.pdf`, document.toBytes())
```

## Incremental PDF update example

```typescript
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import fs from 'fs/promises'

const tmpFolder = `${import.meta.dirname}/tmp`
await fs.mkdir(tmpFolder, { recursive: true })

// Helper functions for creating PDF objects
function createPage(
    contentStreamRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const pageDict = new PdfDictionary()
    pageDict.set('Type', new PdfName('Page'))
    pageDict.set(
        'MediaBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(612),
            new PdfNumber(792),
        ]),
    )
    pageDict.set('Contents', contentStreamRef)
    return new PdfIndirectObject({ content: pageDict })
}

function createPages(
    pages: PdfIndirectObject<PdfDictionary>[],
): PdfIndirectObject<PdfDictionary> {
    const pagesDict = new PdfDictionary()
    pagesDict.set('Type', new PdfName('Pages'))
    pagesDict.set('Kids', new PdfArray(pages.map((x) => x.reference)))
    pagesDict.set('Count', new PdfNumber(pages.length))
    return new PdfIndirectObject({ content: pagesDict })
}

function createCatalog(
    pagesRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const catalogDict = new PdfDictionary()
    catalogDict.set('Type', new PdfName('Catalog'))
    catalogDict.set('Pages', pagesRef)
    return new PdfIndirectObject({ content: catalogDict })
}

function createFont(): PdfIndirectObject<PdfDictionary> {
    const fontDict = new PdfDictionary()
    fontDict.set('Type', new PdfName('Font'))
    fontDict.set('Subtype', new PdfName('Type1'))
    fontDict.set('BaseFont', new PdfName('Helvetica'))
    return new PdfIndirectObject({ content: fontDict })
}

function createResources(
    fontRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const resourcesDict = new PdfDictionary()
    const fontDict = new PdfDictionary()
    fontDict.set('F1', fontRef)
    resourcesDict.set('Font', fontDict)
    return new PdfIndirectObject({ content: resourcesDict })
}

// Step 1: Create an initial PDF document
console.log('Step 1: Creating initial PDF document...')
const document = new PdfDocument()

const font = createFont()
document.add(font)
const resources = createResources(font.reference)
document.add(resources)

const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original:
            'BT /F1 24 Tf 100 700 Td (Original Document - Revision 1) Tj ET',
    }),
})

const page = createPage(contentStream.reference)
page.content.set('Resources', resources.reference)
document.add(page)

const pages = createPages([page])
page.content.set('Parent', pages.reference)
document.add(pages)

const catalog = createCatalog(pages.reference)
document.add(catalog)

document.trailerDict.set('Root', catalog.reference)
document.add(contentStream)

await document.finalize()
// Save the original PDF
const originalPdfPath = `${tmpFolder}/original.pdf`
await fs.writeFile(originalPdfPath, document.toBytes())
console.log(`Original PDF saved to: ${originalPdfPath}`)
console.log(`Original PDF has ${document.revisions.length} revision(s)`)

// Step 2: Load the PDF and perform an incremental update
console.log('\nStep 2: Loading PDF and performing incremental update...')

// Read the existing PDF
const existingPdfBytes = await fs.readFile(originalPdfPath)
const loadedDocument = await PdfDocument.fromBytes([existingPdfBytes], {
    incremental: true,
})

// Lock existing revisions to enable incremental mode
// This ensures changes are added as new revisions instead of modifying existing ones
loadedDocument.setIncremental(true)

// Create new content for the incremental update
// In a real scenario, this could be adding annotations, form fields, signatures, etc.
const newContentStream = new PdfIndirectObject({
    objectNumber: contentStream.objectNumber,
    generationNumber: contentStream.generationNumber,
    content: new PdfStream({
        header: new PdfDictionary(),
        original:
            'BT /F1 18 Tf 100 650 Td (This content was added in Revision 2) Tj ET',
    }),
})

// Add the new content to the document
loadedDocument.add(newContentStream)
await loadedDocument.finalize()

// Save the incrementally updated PDF
const updatedPdfPath = `${tmpFolder}/incremental-update.pdf`
await fs.writeFile(updatedPdfPath, loadedDocument.toBytes())
console.log(`Incrementally updated PDF saved to: ${updatedPdfPath}`)
console.log(`Updated PDF has ${loadedDocument.revisions.length} revision(s)`)

// Step 3: Verify the incremental update preserved the original content
console.log('\nStep 3: Verifying incremental update...')

// Check file sizes to confirm incremental update (new file should be larger)
const originalStats = await fs.stat(originalPdfPath)
const updatedStats = await fs.stat(updatedPdfPath)

console.log(`Original PDF size: ${originalStats.size} bytes`)
console.log(`Updated PDF size: ${updatedStats.size} bytes`)
console.log(
    `Size difference: ${updatedStats.size - originalStats.size} bytes (new revision data)`,
)

// The updated PDF contains the original bytes plus the new revision
// This is the key feature of incremental updates - the original PDF is preserved
const updatedPdfBytes = await fs.readFile(updatedPdfPath)
const originalPdfBytesForComparison = await fs.readFile(originalPdfPath)

// Verify that the beginning of the updated PDF matches the original
const originalBytesMatch = updatedPdfBytes
    .slice(0, originalPdfBytesForComparison.length - 10) // Exclude the %%EOF marker area
    .toString()
    .includes(
        originalPdfBytesForComparison
            .subarray(0, -10)
            .toString()
            .substring(0, 100),
    )

console.log(`Original content preserved: ${originalBytesMatch ? 'Yes' : 'No'}`)

// Step 4: Add another incremental revision
console.log('\nStep 4: Adding another incremental revision...')

const secondUpdate = await PdfDocument.fromBytes([updatedPdfBytes], {
    incremental: true,
})
secondUpdate.setIncremental(true)

const thirdRevisionContent = new PdfIndirectObject({
    objectNumber: contentStream.objectNumber,
    generationNumber: contentStream.generationNumber,
    content: new PdfStream(
        'BT /F1 14 Tf 100 600 Td (Third revision - demonstrates multiple incremental updates) Tj ET',
    ),
})

secondUpdate.add(thirdRevisionContent)
await secondUpdate.finalize()

const multiRevisionPdfPath = `${tmpFolder}/multi-revision.pdf`
await fs.writeFile(multiRevisionPdfPath, secondUpdate.toBytes())
console.log(`Multi-revision PDF saved to: ${multiRevisionPdfPath}`)
console.log(
    `Multi-revision PDF has ${secondUpdate.revisions.length} revision(s)`,
)

const multiRevisionStats = await fs.stat(multiRevisionPdfPath)
console.log(`Multi-revision PDF size: ${multiRevisionStats.size} bytes`)

console.log('\n=== Summary ===')
console.log('Incremental updates allow you to:')
console.log('1. Preserve the original PDF content (important for signatures)')
console.log('2. Add new content without modifying existing revisions')
console.log('3. Maintain a complete history of document changes')
console.log('4. Stack multiple revisions on top of each other')
```

## Modifying AcroForms example - Creating and filling PDF form fields

```typescript
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfBoolean } from 'pdf-lite/core/objects/pdf-boolean'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfString } from 'pdf-lite/core/objects/pdf-string'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import fs from 'fs/promises'

const tmpFolder = `${import.meta.dirname}/tmp`
await fs.mkdir(tmpFolder, { recursive: true })

// Helper function to create a basic page
function createPage(
    contentStreamRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const pageDict = new PdfDictionary()
    pageDict.set('Type', new PdfName('Page'))
    pageDict.set(
        'MediaBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(612),
            new PdfNumber(792),
        ]),
    )
    pageDict.set('Contents', contentStreamRef)
    return new PdfIndirectObject({ content: pageDict })
}

// Helper function to create pages collection
function createPages(
    pages: PdfIndirectObject<PdfDictionary>[],
): PdfIndirectObject<PdfDictionary> {
    const pagesDict = new PdfDictionary()
    pagesDict.set('Type', new PdfName('Pages'))
    pagesDict.set('Kids', new PdfArray(pages.map((x) => x.reference)))
    pagesDict.set('Count', new PdfNumber(pages.length))
    return new PdfIndirectObject({ content: pagesDict })
}

// Helper function to create catalog
function createCatalog(
    pagesRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const catalogDict = new PdfDictionary()
    catalogDict.set('Type', new PdfName('Catalog'))
    catalogDict.set('Pages', pagesRef)
    return new PdfIndirectObject({ content: catalogDict })
}

// Helper function to create font
function createFont(): PdfIndirectObject<PdfDictionary> {
    const fontDict = new PdfDictionary()
    fontDict.set('Type', new PdfName('Font'))
    fontDict.set('Subtype', new PdfName('Type1'))
    fontDict.set('BaseFont', new PdfName('Helvetica'))
    return new PdfIndirectObject({ content: fontDict })
}

// Helper function to create resources
function createResources(
    fontRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const resourcesDict = new PdfDictionary()
    const fontDict = new PdfDictionary()
    fontDict.set('F1', fontRef)
    resourcesDict.set('Font', fontDict)
    return new PdfIndirectObject({ content: resourcesDict })
}

// Helper function to create a text field widget annotation
function createTextField(
    fieldName: string,
    pageRef: PdfObjectReference,
    rect: [number, number, number, number],
    defaultValue: string = '',
): PdfIndirectObject<PdfDictionary> {
    const fieldDict = new PdfDictionary()
    // Annotation properties
    fieldDict.set('Type', new PdfName('Annot'))
    fieldDict.set('Subtype', new PdfName('Widget'))
    // Field type: Text
    fieldDict.set('FT', new PdfName('Tx'))
    // Field name
    fieldDict.set('T', new PdfString(fieldName))
    // Bounding rectangle [x1, y1, x2, y2]
    fieldDict.set(
        'Rect',
        new PdfArray([
            new PdfNumber(rect[0]),
            new PdfNumber(rect[1]),
            new PdfNumber(rect[2]),
            new PdfNumber(rect[3]),
        ]),
    )
    // Annotation flags (4 = print)
    fieldDict.set('F', new PdfNumber(4))
    // Parent page reference
    fieldDict.set('P', pageRef)
    // Default value (if any)
    if (defaultValue) {
        fieldDict.set('V', new PdfString(defaultValue))
        fieldDict.set('DV', new PdfString(defaultValue))
    }
    // Default appearance string (font and size)
    fieldDict.set('DA', new PdfString('/Helv 12 Tf 0 g'))

    // Border style (solid, 1pt width)
    const borderDict = new PdfDictionary()
    borderDict.set('W', new PdfNumber(1))
    borderDict.set('S', new PdfName('S'))
    fieldDict.set('BS', borderDict)

    // Appearance characteristics
    const mkDict = new PdfDictionary()
    mkDict.set('BC', new PdfArray([new PdfNumber(0)])) // Border color (black)
    mkDict.set('BG', new PdfArray([new PdfNumber(1)])) // Background color (white)
    fieldDict.set('MK', mkDict)

    return new PdfIndirectObject({ content: fieldDict })
}

// Helper function to create a checkbox field widget annotation
function createCheckboxField(
    fieldName: string,
    pageRef: PdfObjectReference,
    rect: [number, number, number, number],
    checked: boolean = false,
): PdfIndirectObject<PdfDictionary> {
    const fieldDict = new PdfDictionary()
    // Annotation properties
    fieldDict.set('Type', new PdfName('Annot'))
    fieldDict.set('Subtype', new PdfName('Widget'))
    // Field type: Button
    fieldDict.set('FT', new PdfName('Btn'))
    // Field name
    fieldDict.set('T', new PdfString(fieldName))
    // Bounding rectangle
    fieldDict.set(
        'Rect',
        new PdfArray([
            new PdfNumber(rect[0]),
            new PdfNumber(rect[1]),
            new PdfNumber(rect[2]),
            new PdfNumber(rect[3]),
        ]),
    )
    // Annotation flags (4 = print)
    fieldDict.set('F', new PdfNumber(4))
    // Parent page reference
    fieldDict.set('P', pageRef)
    // Value: /Yes for checked, /Off for unchecked
    fieldDict.set('V', new PdfName(checked ? 'Yes' : 'Off'))
    fieldDict.set('AS', new PdfName(checked ? 'Yes' : 'Off'))

    // Border style
    const borderDict = new PdfDictionary()
    borderDict.set('W', new PdfNumber(1))
    borderDict.set('S', new PdfName('S'))
    fieldDict.set('BS', borderDict)

    // Appearance characteristics
    const mkDict = new PdfDictionary()
    mkDict.set('BC', new PdfArray([new PdfNumber(0)])) // Border color (black)
    mkDict.set('BG', new PdfArray([new PdfNumber(1)])) // Background color (white)
    fieldDict.set('MK', mkDict)

    return new PdfIndirectObject({ content: fieldDict })
}

// ============================================
// PART 1: Create a PDF with form fields
// ============================================

const document = new PdfDocument()

// Create font
const font = createFont()
document.add(font)

// Create resources with the font
const resources = createResources(font.reference)
document.add(resources)

// Create content stream with form labels
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: `BT
/F1 18 Tf 72 720 Td (PDF Form Example) Tj
/F1 12 Tf 0 -40 Td (Name:) Tj
0 -30 Td (Email:) Tj
0 -30 Td (Phone:) Tj
0 -30 Td (Subscribe to newsletter:) Tj
ET `,
    }),
})
document.add(contentStream)

// Create page
const page = createPage(contentStream.reference)
page.content.set('Resources', resources.reference)
document.add(page)

// Create form fields
const nameField = createTextField('name', page.reference, [150, 665, 400, 685])
const emailField = createTextField(
    'email',
    page.reference,
    [150, 635, 400, 655],
)
const phoneField = createTextField(
    'phone',
    page.reference,
    [150, 605, 400, 625],
)
const subscribeField = createCheckboxField(
    'subscribe',
    page.reference,
    [200, 575, 215, 590],
)

document.add(nameField)
document.add(emailField)
document.add(phoneField)
document.add(subscribeField)

// Add annotations to page
page.content.set(
    'Annots',
    new PdfArray([
        nameField.reference,
        emailField.reference,
        phoneField.reference,
        subscribeField.reference,
    ]),
)

// Create pages collection
const pages = createPages([page])
page.content.set('Parent', pages.reference)
document.add(pages)

// Create catalog
const catalog = createCatalog(pages.reference)

// Create AcroForm with all fields
const acroForm = new PdfDictionary()
acroForm.set(
    'Fields',
    new PdfArray([
        nameField.reference,
        emailField.reference,
        phoneField.reference,
        subscribeField.reference,
    ]),
)
// With appearance streams provided, we don't need NeedAppearances
// This prevents Acrobat from modifying the PDF on open
acroForm.set('NeedAppearances', new PdfBoolean(true))

// Default resources for the form (font)
const formResources = new PdfDictionary()
const formFontDict = new PdfDictionary()
const helveticaFont = new PdfDictionary()
helveticaFont.set('Type', new PdfName('Font'))
helveticaFont.set('Subtype', new PdfName('Type1'))
helveticaFont.set('BaseFont', new PdfName('Helvetica'))
const helveticaFontObj = new PdfIndirectObject({ content: helveticaFont })
document.add(helveticaFontObj)
formFontDict.set('Helv', helveticaFontObj.reference)
formResources.set('Font', formFontDict)
acroForm.set('DR', formResources)
acroForm.set('DA', new PdfString('/Helv 12 Tf 0 g'))

const acroFormObj = new PdfIndirectObject({ content: acroForm })
document.add(acroFormObj)
catalog.content.set('AcroForm', acroFormObj.reference)

document.add(catalog)

// Set the catalog as the root
document.trailerDict.set('Root', catalog.reference)

await document.finalize()

// Save the empty form
// This demonstrates creating a blank form that users can fill in
await fs.writeFile(`${tmpFolder}/form-empty.pdf`, document.toBytes())
console.log('Created form-empty.pdf with empty form fields')

// ============================================
// PART 2: Fill in the form fields
// ============================================
// This demonstrates how to programmatically fill in form fields.
// We now read the previously saved empty form and modify it.

// Read the empty form PDF
const emptyFormBytes = await fs.readFile(`${tmpFolder}/form-empty.pdf`)
const filledDocument = await PdfDocument.fromBytes([emptyFormBytes])

const acroform = filledDocument.acroform
if (!acroform) {
    throw new Error('No AcroForm found in the document')
}
acroform.importData({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    subscribe: 'Off', // For checkbox, use the "Yes/Off" value
})

// Save the filled form
await fs.writeFile(`${tmpFolder}/form-filled.pdf`, filledDocument.toBytes())
console.log('Created form-filled.pdf with filled form fields')

console.log('\nForm field values:')
console.log('- Name: John Doe')
console.log('- Email: john.doe@example.com')
console.log('- Phone: +1 (555) 123-4567')
console.log('- Subscribe: Off')
```

## Tokeniser usage example

```typescript
import { PdfByteStreamTokeniser } from 'pdf-lite/core/tokeniser'
import { PdfToken } from 'pdf-lite/core/tokens/token'
import { stringToBytes } from 'pdf-lite/utils/stringToBytes'

/**
 * This example demonstrates how to use the PdfByteStreamTokeniser
 * to tokenize PDF content into individual tokens.
 *
 * The tokeniser converts raw PDF bytes into a stream of tokens that can
 * be further processed by the decoder or used for PDF analysis.
 */

// Sample PDF content to tokenize
const pdfContent = `%PDF-2.0
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
trailer
<< /Size 4 /Root 1 0 R >>
startxref
0
%%EOF`

// Create the tokeniser
const tokeniser = new PdfByteStreamTokeniser()

// Convert the PDF content to bytes and feed it to the tokeniser
const bytes = stringToBytes(pdfContent)
tokeniser.feedBytes(bytes)

// Signal end of input
tokeniser.eof = true

// Collect all tokens
const tokens: PdfToken[] = []
for (const token of tokeniser.nextItems()) {
    tokens.push(token)
}

// Display tokenisation results
console.log('PDF Tokenisation Example')
console.log('========================\n')
console.log(`Input: ${pdfContent.length} bytes`)
console.log(`Output: ${tokens.length} tokens\n`)

// Group tokens by type for summary
const tokenCounts = new Map<string, number>()
for (const token of tokens) {
    const type = token.constructor.name
    tokenCounts.set(type, (tokenCounts.get(type) ?? 0) + 1)
}

console.log('Token type counts:')
for (const [type, count] of tokenCounts) {
    console.log(`  ${type}: ${count}`)
}

console.log('\nFirst 20 tokens:')
for (const token of tokens.slice(0, 20)) {
    const tokenString = token.toString().slice(0, 40)
    const displayString =
        tokenString.length >= 40 ? tokenString + '...' : tokenString
    console.log(
        `  ${token.constructor.name.padEnd(30)} ${JSON.stringify(displayString)}`,
    )
}

// Example: Tokenising incrementally (useful for streaming)
console.log('\n\nIncremental Tokenisation Example')
console.log('=================================\n')

const incrementalTokeniser = new PdfByteStreamTokeniser()

// Feed bytes in chunks (simulating streaming)
const chunkSize = 50
const numChunks = Math.ceil(bytes.length / chunkSize)

console.log(`Processing ${numChunks} chunks of ~${chunkSize} bytes each...`)

let totalTokens = 0
for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    incrementalTokeniser.feedBytes(chunk)

    // Process tokens as they become available
    for (const _ of incrementalTokeniser.nextItems()) {
        totalTokens++
    }
}

// Signal end of input and collect remaining tokens
incrementalTokeniser.eof = true
for (const _ of incrementalTokeniser.nextItems()) {
    totalTokens++
}

console.log(`Total tokens produced: ${totalTokens}`)

// Example: Custom stream chunk size
console.log('\n\nCustom Stream Chunk Size Example')
console.log('================================\n')

const customTokeniser = new PdfByteStreamTokeniser({
    streamChunkSizeBytes: 512, // Customize the chunk size for stream content
})

const streamContent = `1 0 obj
<< /Length 100 >>
stream
This is stream content that will be chunked by the tokeniser.
The chunk size determines how the stream data is delivered.
endstream
endobj`

customTokeniser.feedBytes(stringToBytes(streamContent))
customTokeniser.eof = true

console.log('Tokens from stream content:')
for (const token of customTokeniser.nextItems()) {
    const type = token.constructor.name
    const preview = token.toString().slice(0, 50).replace(/\n/g, '\\n')
    console.log(`  ${type.padEnd(25)} ${JSON.stringify(preview)}`)
}
```

## Decoder usage example

```typescript
import { PdfDecoder } from 'pdf-lite/core/decoder'
import { PdfByteStreamTokeniser } from 'pdf-lite/core/tokeniser'
import { pdfDecoder } from 'pdf-lite/core/generators'
import { PdfObject } from 'pdf-lite/core/objects/pdf-object'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfTrailer } from 'pdf-lite/core/objects/pdf-trailer'
import { PdfXRefTable } from 'pdf-lite/core/objects/pdf-xref-table'
import { PdfComment } from 'pdf-lite/core/objects/pdf-comment'
import { PdfStartXRef } from 'pdf-lite/core/objects/pdf-start-xref'
import { stringToBytes } from 'pdf-lite/utils/stringToBytes'

/**
 * This example demonstrates how to use the PdfDecoder
 * to decode PDF tokens into PDF objects.
 *
 * The decoder transforms a stream of tokens (from the tokeniser)
 * into high-level PDF objects like dictionaries, arrays, streams,
 * and indirect objects.
 */

// Sample PDF content to decode
const pdfContent = `%PDF-2.0
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 100 700 Td (Hello!) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000118 00000 n
0000000217 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
310
%%EOF`

// Method 1: Using the pdfDecoder generator (recommended)
console.log('PDF Decoder Example - Using pdfDecoder Generator')
console.log('================================================\n')

const bytes = stringToBytes(pdfContent)
const objects: PdfObject[] = []

for (const obj of pdfDecoder([bytes])) {
    objects.push(obj)
}

console.log(`Decoded ${objects.length} PDF objects:\n`)

for (const obj of objects) {
    const type = obj.constructor.name

    if (obj instanceof PdfComment) {
        console.log(`  ${type}: ${obj.toString().trim()}`)
    } else if (obj instanceof PdfIndirectObject) {
        const contentType = obj.content.constructor.name
        console.log(
            `  ${type}: ${obj.objectNumber} ${obj.generationNumber} obj (${contentType})`,
        )

        // Show dictionary keys if content is a dictionary or stream
        if (obj.content instanceof PdfDictionary) {
            const keys = Object.keys(obj.content.values)
            console.log(`    Keys: ${keys.join(', ')}`)
        }
        if (obj.content instanceof PdfStream) {
            console.log(
                `    Stream length: ${obj.content.original.length} bytes`,
            )
        }
    } else if (obj instanceof PdfXRefTable) {
        console.log(`  ${type}: ${obj.entries.length} entries`)
    } else if (obj instanceof PdfTrailer) {
        const size = obj.dict.get('Size')?.toString() ?? 'unknown'
        console.log(`  ${type}: Size=${size}`)
    } else if (obj instanceof PdfStartXRef) {
        console.log(`  ${type}: offset=${obj.offset}`)
    } else {
        console.log(`  ${type}`)
    }
}

// Method 2: Using the PdfDecoder class directly with a tokeniser
console.log('\n\nPDF Decoder Example - Manual Pipeline')
console.log('======================================\n')

const tokeniser = new PdfByteStreamTokeniser()
const decoder = new PdfDecoder({ ignoreWhitespace: true })

// Feed bytes to tokeniser
tokeniser.feedBytes(bytes)
tokeniser.eof = true

// Feed tokens to decoder
for (const token of tokeniser.nextItems()) {
    decoder.feed(token)
}
decoder.eof = true

// Collect decoded objects
const manualObjects: PdfObject[] = []
for (const obj of decoder.nextItems()) {
    manualObjects.push(obj)
}

console.log(`Decoded ${manualObjects.length} objects with whitespace ignored\n`)

// Count objects by type
const typeCounts = new Map<string, number>()
for (const obj of manualObjects) {
    const type = obj.constructor.name
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1)
}

console.log('Object type counts:')
for (const [type, count] of typeCounts) {
    console.log(`  ${type}: ${count}`)
}

// Example: Incremental decoding (useful for streaming)
console.log('\n\nIncremental Decoding Example')
console.log('============================\n')

const streamTokeniser = new PdfByteStreamTokeniser()
const streamDecoder = new PdfDecoder()

// Simulate streaming by processing in chunks
const chunkSize = 100
let objectCount = 0

for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    streamTokeniser.feedBytes(chunk)

    // Process available tokens
    for (const token of streamTokeniser.nextItems()) {
        streamDecoder.feed(token)

        // Collect any complete objects
        for (const obj of streamDecoder.nextItems()) {
            objectCount++
            console.log(
                `  Chunk ${Math.floor(i / chunkSize) + 1}: Found ${obj.constructor.name}`,
            )
        }
    }
}

// Finalize
streamTokeniser.eof = true
streamDecoder.eof = true

for (const token of streamTokeniser.nextItems()) {
    streamDecoder.feed(token)
}

for (const obj of streamDecoder.nextItems()) {
    objectCount++
    console.log(`  Final: Found ${obj.constructor.name}`)
}

console.log(`\nTotal objects decoded incrementally: ${objectCount}`)

// Example: Preserving whitespace for round-trip
console.log('\n\nRound-Trip Example (Preserving Whitespace)')
console.log('==========================================\n')

const simpleDict = `<< /Type /Page /MediaBox [0 0 612 792] >>`
const preservingDecoder = pdfDecoder([stringToBytes(simpleDict)], {
    ignoreWhitespace: false,
})

for (const obj of preservingDecoder) {
    // toString() will recreate the original representation
    const reconstructed = obj.toString()
    console.log('Original:     ', JSON.stringify(simpleDict))
    console.log('Reconstructed:', JSON.stringify(reconstructed))
    console.log('Match:', simpleDict === reconstructed)
}
```

## PDF verify signatures example

```typescript
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { PdfString } from 'pdf-lite/core/objects/pdf-string'
import {
    PdfAdbePkcsX509RsaSha1SignatureObject,
    PdfAdbePkcs7DetachedSignatureObject,
    PdfAdbePkcs7Sha1SignatureObject,
    PdfEtsiCadesDetachedSignatureObject,
    PdfEtsiRfc3161SignatureObject,
} from 'pdf-lite'
import { rsaSigningKeys } from '../packages/pdf-lite/test/unit/fixtures/rsa-2048/index'

function createPage(
    contentStreamRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const pageDict = new PdfDictionary()
    pageDict.set('Type', new PdfName('Page'))
    pageDict.set(
        'MediaBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(612),
            new PdfNumber(792),
        ]),
    )
    pageDict.set('Contents', contentStreamRef)
    return new PdfIndirectObject({ content: pageDict })
}

function createPages(
    pages: PdfIndirectObject<PdfDictionary>[],
): PdfIndirectObject<PdfDictionary> {
    const pagesDict = new PdfDictionary()
    pagesDict.set('Type', new PdfName('Pages'))
    pagesDict.set('Kids', new PdfArray(pages.map((x) => x.reference)))
    pagesDict.set('Count', new PdfNumber(pages.length))
    return new PdfIndirectObject({ content: pagesDict })
}

function createCatalog(
    pagesRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const catalogDict = new PdfDictionary()
    catalogDict.set('Type', new PdfName('Catalog'))
    catalogDict.set('Pages', pagesRef)
    return new PdfIndirectObject({ content: catalogDict })
}

function createFont(): PdfIndirectObject<PdfDictionary> {
    const fontDict = new PdfDictionary()
    fontDict.set('Type', new PdfName('Font'))
    fontDict.set('Subtype', new PdfName('Type1'))
    fontDict.set('BaseFont', new PdfName('Helvetica'))
    return new PdfIndirectObject({ content: fontDict })
}

function createResources(
    fontRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const resourcesDict = new PdfDictionary()
    const fontDict = new PdfDictionary()
    fontDict.set('F1', fontRef)
    resourcesDict.set('Font', fontDict)
    return new PdfIndirectObject({ content: resourcesDict })
}

function createPageWithSignatureField(
    contentStreamRef: PdfObjectReference,
    signatureAnnotRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const pageDict = new PdfDictionary()
    pageDict.set('Type', new PdfName('Page'))
    pageDict.set(
        'MediaBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(612),
            new PdfNumber(792),
        ]),
    )
    pageDict.set('Contents', contentStreamRef)
    pageDict.set('Annots', new PdfArray([signatureAnnotRef]))

    return new PdfIndirectObject({ content: pageDict })
}

function createSignatureAnnotation(
    signatureRef: PdfObjectReference,
    appearanceStreamRef: PdfObjectReference,
    pageRef: PdfObjectReference,
    signatureName: string,
): PdfIndirectObject<PdfDictionary> {
    const signatureAnnotation = new PdfDictionary()
    signatureAnnotation.set('Type', new PdfName('Annot'))
    signatureAnnotation.set('Subtype', new PdfName('Widget'))
    signatureAnnotation.set('FT', new PdfName('Sig'))
    signatureAnnotation.set('T', new PdfString(signatureName))
    signatureAnnotation.set(
        'Rect',
        new PdfArray([
            new PdfNumber(135), // x1: Start after "Signature: " text (~72 + 63)
            new PdfNumber(640), // y1: Bottom of signature area (652 - 12)
            new PdfNumber(400), // x2: End of signature line
            new PdfNumber(665), // y2: Top of signature area (652 + 13)
        ]),
    )
    signatureAnnotation.set('F', new PdfNumber(4))
    signatureAnnotation.set('P', pageRef) // Reference to parent page
    signatureAnnotation.set('V', signatureRef)

    // Add appearance dictionary
    const appearanceDict = new PdfDictionary()
    appearanceDict.set('N', appearanceStreamRef)
    signatureAnnotation.set('AP', appearanceDict)

    return new PdfIndirectObject({ content: signatureAnnotation })
}

function createSignatureAppearance(): PdfIndirectObject<PdfStream> {
    // Create font for appearance
    const appearanceFont = new PdfDictionary()
    appearanceFont.set('Type', new PdfName('Font'))
    appearanceFont.set('Subtype', new PdfName('Type1'))
    appearanceFont.set('BaseFont', new PdfName('Helvetica'))

    const fontDict = new PdfDictionary()
    fontDict.set('F1', appearanceFont)

    const resourcesDict = new PdfDictionary()
    resourcesDict.set('Font', fontDict)

    // Create appearance stream header
    const appearanceHeader = new PdfDictionary()
    appearanceHeader.set('Type', new PdfName('XObject'))
    appearanceHeader.set('Subtype', new PdfName('Form'))
    appearanceHeader.set(
        'BBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(265), // Width: 400 - 135
            new PdfNumber(25), // Height: 665 - 640
        ]),
    )
    appearanceHeader.set('Resources', resourcesDict)

    // Create appearance stream for the signature
    return new PdfIndirectObject({
        content: new PdfStream({
            header: appearanceHeader,
            original:
                'BT /F1 10 Tf 5 14 Td (Digitally signed by: Jake Shirley) Tj ET',
        }),
    })
}

// Create the document
const document = new PdfDocument()

// Create font
const font = createFont()
document.add(font)

// Create resources with the font
const resources = createResources(font.reference)
document.add(resources)

// Create content stream for first page
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: 'BT /F1 24 Tf 100 700 Td (Hello, PDF-Lite!) Tj ET',
    }),
})
document.add(contentStream)

// Create first page
const page1 = createPage(contentStream.reference)
page1.content.set('Resources', resources.reference)
document.add(page1)

// Array to hold all pages and signature objects
const allPages: PdfIndirectObject<PdfDictionary>[] = [page1]
const allSignatures: any[] = []
const signatureFields: PdfObjectReference[] = []

// Helper function to create a signature page
function createSignaturePage(
    signatureType: string,
    signatureObj: any,
    pageNumber: number,
) {
    const content = new PdfIndirectObject({
        content: new PdfStream({
            header: new PdfDictionary(),
            original: `BT /F1 12 Tf 72 712 Td (Signature Type: ${signatureType}) Tj 0 -60 Td (Signature: ________________________________) Tj ET`,
        }),
    })
    document.add(content)

    const appearance = createSignatureAppearance()
    document.add(appearance)

    // Create page first to get its reference
    const page = createPageWithSignatureField(
        content.reference,
        new PdfObjectReference(0, 0), // Temporary placeholder
    )
    page.content.set('Resources', resources.reference)
    document.add(page)

    // Now create annotation with page reference
    const annotation = createSignatureAnnotation(
        signatureObj.reference,
        appearance.reference,
        page.reference,
        `Signature${pageNumber}`,
    )
    document.add(annotation)

    // Update page's Annots array with actual annotation reference
    page.content.set('Annots', new PdfArray([annotation.reference]))

    signatureFields.push(annotation.reference)
    return page
}

// Page 2: Adobe PKCS7 Detached
const pkcs7DetachedSig = new PdfAdbePkcs7DetachedSignatureObject({
    privateKey: rsaSigningKeys.privateKey,
    certificate: rsaSigningKeys.cert,
    issuerCertificate: rsaSigningKeys.caCert,
    name: 'Jake Shirley',
    location: 'Earth',
    reason: 'PKCS7 Detached Signature',
    contactInfo: 'test@test.com',
    revocationInfo: {
        crls: [rsaSigningKeys.caCrl],
        ocsps: [rsaSigningKeys.ocspResponse],
    },
})
allSignatures.push(pkcs7DetachedSig)
allPages.push(createSignaturePage('Adobe PKCS7 Detached', pkcs7DetachedSig, 2))

// Page 3: Adobe PKCS7 SHA1
const pkcs7Sha1Sig = new PdfAdbePkcs7Sha1SignatureObject({
    privateKey: rsaSigningKeys.privateKey,
    certificate: rsaSigningKeys.cert,
    issuerCertificate: rsaSigningKeys.caCert,
    name: 'Jake Shirley',
    location: 'Earth',
    reason: 'PKCS7 SHA1 Signature',
    contactInfo: 'test@test.com',
})
allSignatures.push(pkcs7Sha1Sig)
allPages.push(createSignaturePage('Adobe PKCS7 SHA1', pkcs7Sha1Sig, 3))

// Page 4: Adobe X509 RSA SHA1
const x509RsaSha1Sig = new PdfAdbePkcsX509RsaSha1SignatureObject({
    privateKey: rsaSigningKeys.privateKey,
    certificate: rsaSigningKeys.cert,
    additionalCertificates: [rsaSigningKeys.caCert],
    name: 'Jake Shirley',
    location: 'Earth',
    reason: 'X509 RSA SHA1 Signature',
    contactInfo: 'test@test.com',
    revocationInfo: {
        crls: [rsaSigningKeys.caCrl],
        ocsps: [rsaSigningKeys.ocspResponse],
    },
})
allSignatures.push(x509RsaSha1Sig)
allPages.push(createSignaturePage('Adobe X509 RSA SHA1', x509RsaSha1Sig, 4))

// Page 5: ETSI CAdES Detached
const cadesDetachedSig = new PdfEtsiCadesDetachedSignatureObject({
    privateKey: rsaSigningKeys.privateKey,
    certificate: rsaSigningKeys.cert,
    issuerCertificate: rsaSigningKeys.caCert,
    name: 'Jake Shirley',
    location: 'Earth',
    reason: 'CAdES Detached Signature',
    contactInfo: 'test@test.com',
    revocationInfo: {
        crls: [rsaSigningKeys.caCrl],
        ocsps: [rsaSigningKeys.ocspResponse],
    },
})
allSignatures.push(cadesDetachedSig)
allPages.push(createSignaturePage('ETSI CAdES Detached', cadesDetachedSig, 5))

// Page 6: ETSI RFC3161 (Timestamp)
const rfc3161Sig = new PdfEtsiRfc3161SignatureObject({
    timeStampAuthority: {
        url: 'https://freetsa.org/tsr',
    },
})
allSignatures.push(rfc3161Sig)
allPages.push(createSignaturePage('ETSI RFC3161 Timestamp', rfc3161Sig, 6))

// Create pages collection with all pages
const pages = createPages(allPages)
// Set parent reference for all pages
allPages.forEach((page) => {
    page.content.set('Parent', pages.reference)
})
document.add(pages)

// Create catalog with AcroForm
const catalog = createCatalog(pages.reference)

// Add AcroForm to catalog with all signature fields
const acroForm = new PdfDictionary()
acroForm.set('Fields', new PdfArray(signatureFields))
acroForm.set('SigFlags', new PdfNumber(3))
const acroFormObj = new PdfIndirectObject({ content: acroForm })
document.add(acroFormObj)
catalog.content.set('AcroForm', acroFormObj.reference)

document.add(catalog)

// Set the catalog as the root
document.trailerDict.set('Root', catalog.reference)

// IMPORTANT: Add all signatures LAST - after all other objects
// This ensures the ByteRange is calculated correctly for each signature
allSignatures.forEach((sig) => {
    document.startNewRevision()
    document.add(sig)
})

await document.finalize()

const documentBytes = document.toBytes()
const newDocument = await PdfDocument.fromBytes([documentBytes])

const validationResult = await newDocument.verifySignatures()
console.log(
    'Signature validation result:',
    JSON.stringify(validationResult, null, 2),
)
```

## Custom font embedding example

```typescript
// Demonstrates how to embed TrueType fonts and use standard PDF fonts
// Shows PdfFont.fromBytes() which auto-detects TTF, OTF, and WOFF formats

import { writeFileSync, readFileSync, existsSync } from 'fs'
import { PdfFont } from 'pdf-lite'
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'

// Helper to create a page
// Note: Pages inherit Resources from parent /Pages node, so no need to set it here
function createPage(
    contentStreamRef: PdfIndirectObject<PdfStream>,
    pagesRef: PdfIndirectObject<PdfDictionary>,
): PdfIndirectObject<PdfDictionary> {
    const pageDict = new PdfDictionary()
    pageDict.set('Type', new PdfName('Page'))
    pageDict.set(
        'MediaBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(612),
            new PdfNumber(792),
        ]),
    )
    pageDict.set('Contents', contentStreamRef.reference)
    // Resources are inherited from the parent /Pages node
    pageDict.set('Parent', pagesRef.reference)
    return new PdfIndirectObject({ content: pageDict })
}

function createPages(): PdfIndirectObject<PdfDictionary> {
    const pagesDict = new PdfDictionary()
    pagesDict.set('Type', new PdfName('Pages'))
    pagesDict.set('Kids', new PdfArray([]))
    pagesDict.set('Count', new PdfNumber(0))
    return new PdfIndirectObject({ content: pagesDict })
}

function createCatalog(
    pagesRef: PdfIndirectObject<PdfDictionary>,
): PdfIndirectObject<PdfDictionary> {
    const catalogDict = new PdfDictionary()
    catalogDict.set('Type', new PdfName('Catalog'))
    catalogDict.set('Pages', pagesRef.reference)
    return new PdfIndirectObject({ content: catalogDict })
}

async function main() {
    const document = new PdfDocument()

    // Create document structure
    const pages = createPages()
    const catalog = createCatalog(pages)

    document.add(pages, catalog)
    document.trailerDict.set('Root', catalog.reference)
    await document.finalize()

    // Build content stream with different fonts
    // F1=Helvetica-Bold, F2=Times-Roman, F3=Courier, F4=Roboto
    const lines: string[] = [
        'BT',
        '/F1 24 Tf',
        '72 700 Td',
        '(PDF-Lite Custom Fonts Demo) Tj',
        '/F4 16 Tf',
        '0 -40 Td',
        '(This line uses embedded Roboto font via PdfFont.fromBytes!) Tj',
        '/F2 14 Tf',
        '0 -30 Td',
        '(This line uses Times Roman) Tj',
        '/F3 12 Tf',
        '0 -30 Td',
        '(This line uses Courier - great for code!) Tj',
        '/F2 12 Tf',
        '0 -50 Td',
        '(PdfFont.fromBytes auto-detects font formats:) Tj',
        '0 -20 Td',
        '(- TTF \\(TrueType Fonts\\)) Tj',
        '0 -20 Td',
        '(- OTF \\(OpenType Fonts - non-CFF based\\)) Tj',
        '0 -20 Td',
        '(- WOFF \\(Web Open Font Format\\)) Tj',
        '/F2 10 Tf',
        '0 -30 Td',
        '(Standard PDF fonts built into all readers:) Tj',
        '0 -16 Td',
        '(Helvetica, Times-Roman, Courier, Symbol, ZapfDingbats) Tj',
        '/F4 12 Tf',
        '0 -30 Td',
        '(Custom fonts are automatically parsed and embedded!) Tj',
        'ET',
    ]

    const contentStream = new PdfIndirectObject({
        content: new PdfStream({
            header: new PdfDictionary(),
            original: lines.join('\n'),
        }),
    })

    // Create standard fonts and assign resource names to match the content stream
    const helveticaBold = PdfFont.fromStandardFont('Helvetica-Bold')
    helveticaBold.resourceName = 'F1'
    const timesRoman = PdfFont.fromStandardFont('Times-Roman')
    timesRoman.resourceName = 'F2'
    const courier = PdfFont.fromStandardFont('Courier')
    courier.resourceName = 'F3'

    console.log(
        `Embedded standard fonts: ${helveticaBold}, ${timesRoman}, ${courier}`,
    )

    // Embed custom TrueType font using PdfFont.fromBytes
    // This method auto-detects the font format (TTF, OTF, WOFF)
    const fontPath = `${import.meta.dirname}/tmp/Roboto-Regular.ttf`

    if (!existsSync(fontPath)) {
        console.error(`Font not found: ${fontPath}`)
        console.error(
            'Download it with: curl -L -o examples/tmp/Roboto-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/roboto/Roboto%5Bwdth%2Cwght%5D.ttf"',
        )
        process.exit(1)
    }

    const fontData = readFileSync(fontPath)

    // PdfFont.fromBytes automatically:
    // - Detects font format (TTF, OTF, WOFF)
    // - Parses font tables and extracts metrics
    // - Creates a ready-to-use PdfFont instance
    // - Throws descriptive errors for unsupported formats (WOFF2, CFF-based OTF)
    const robotoFont = PdfFont.fromBytes(fontData)
    robotoFont.resourceName = 'F4'

    console.log(
        `Created PdfFont from bytes - Font name: ${robotoFont.fontName}`,
    )
    console.log(`  Font data size: ${fontData.length} bytes`)
    console.log(
        `  Embedded font data preserved: ${robotoFont.fontData ? 'Yes' : 'No'}`,
    )

    // Add all fonts to the document
    document.add(helveticaBold, timesRoman, courier, robotoFont)
    console.log(`Embedded custom font in PDF: ${robotoFont}`)

    // Build a Font resource dictionary mapping resource names to font references
    const fontDict = new PdfDictionary()
    fontDict.set(helveticaBold.resourceName, helveticaBold.reference)
    fontDict.set(timesRoman.resourceName, timesRoman.reference)
    fontDict.set(courier.resourceName, courier.reference)
    fontDict.set(robotoFont.resourceName, robotoFont.reference)

    // Add font resources to the /Pages node so all child pages inherit them
    const resourcesDict = new PdfDictionary()
    resourcesDict.set('Font', fontDict)
    pages.content.set('Resources', resourcesDict)

    console.log(`\nFont resource mappings:`)
    console.log(`  ${helveticaBold.resourceName} = Helvetica-Bold`)
    console.log(`  ${timesRoman.resourceName} = Times-Roman`)
    console.log(`  ${courier.resourceName} = Courier`)
    console.log(`  ${robotoFont.resourceName} = Roboto-Regular`)

    // Create page (it will inherit fonts from parent /Pages node)
    const page = createPage(contentStream, pages)

    // Update pages collection
    pages.content.set('Kids', new PdfArray([page.reference]))
    pages.content.set('Count', new PdfNumber(1))

    document.add(contentStream, page)
    await document.finalize()

    console.log(`\nFont resource mappings:`)
    console.log(`  ${helveticaBold.resourceName} = Helvetica-Bold`)
    console.log(`  ${timesRoman.resourceName} = Times-Roman`)
    console.log(`  ${courier.resourceName} = Courier`)
    console.log(`  ${robotoFont.resourceName} = Roboto-Regular`)

    // Write output
    const outputPath = `${import.meta.dirname}/tmp/fonts-demo.pdf`
    writeFileSync(outputPath, document.toBytes())
    console.log(`\nPDF written to: ${outputPath}`)
}

main().catch(console.error)
```

## JavaScript Actions example - Executing JS actions in PDF form fields

```typescript
//
// PDF forms generated by Adobe Acrobat and LiveCycle often include JavaScript
// actions for formatting, validation, and field calculations. The
// PdfJavaScriptEngine executes these automatically when setting field values,
// with built-in support for common Acrobat JS functions.

import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfBoolean } from 'pdf-lite/core/objects/pdf-boolean'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfString } from 'pdf-lite/core/objects/pdf-string'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { PdfJavaScriptEngine } from 'pdf-lite/acroform/js/pdf-js-engine-impl'
import fs from 'fs/promises'

const tmpFolder = `${import.meta.dirname}/tmp`
await fs.mkdir(tmpFolder, { recursive: true })

// ============================================
// Helpers
// ============================================

function createPage(
    contentStreamRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const d = new PdfDictionary()
    d.set('Type', new PdfName('Page'))
    d.set(
        'MediaBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(612),
            new PdfNumber(792),
        ]),
    )
    d.set('Contents', contentStreamRef)
    return new PdfIndirectObject({ content: d })
}

function createPages(
    pages: PdfIndirectObject<PdfDictionary>[],
): PdfIndirectObject<PdfDictionary> {
    const d = new PdfDictionary()
    d.set('Type', new PdfName('Pages'))
    d.set('Kids', new PdfArray(pages.map((x) => x.reference)))
    d.set('Count', new PdfNumber(pages.length))
    return new PdfIndirectObject({ content: d })
}

function createCatalog(
    pagesRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const d = new PdfDictionary()
    d.set('Type', new PdfName('Catalog'))
    d.set('Pages', pagesRef)
    return new PdfIndirectObject({ content: d })
}

/** Create a text field with an optional JavaScript format action. */
function createTextField(
    fieldName: string,
    pageRef: PdfObjectReference,
    rect: [number, number, number, number],
    jsFormatCode?: string,
    jsCalcCode?: string,
): PdfIndirectObject<PdfDictionary> {
    const d = new PdfDictionary()
    d.set('Type', new PdfName('Annot'))
    d.set('Subtype', new PdfName('Widget'))
    d.set('FT', new PdfName('Tx'))
    d.set('T', new PdfString(fieldName))
    d.set(
        'Rect',
        new PdfArray([
            new PdfNumber(rect[0]),
            new PdfNumber(rect[1]),
            new PdfNumber(rect[2]),
            new PdfNumber(rect[3]),
        ]),
    )
    d.set('F', new PdfNumber(4))
    d.set('P', pageRef)
    d.set('DA', new PdfString('/Helv 12 Tf 0 g'))

    // Add /AA (additional actions) dictionary with JS format/calculate actions
    if (jsFormatCode || jsCalcCode) {
        const aa = new PdfDictionary()
        if (jsFormatCode) {
            const fmtAction = new PdfDictionary()
            fmtAction.set('S', new PdfName('JavaScript'))
            fmtAction.set('JS', new PdfString(jsFormatCode))
            aa.set('F', fmtAction)
        }
        if (jsCalcCode) {
            const calcAction = new PdfDictionary()
            calcAction.set('S', new PdfName('JavaScript'))
            calcAction.set('JS', new PdfString(jsCalcCode))
            aa.set('C', calcAction)
        }
        d.set('AA', aa)
    }

    return new PdfIndirectObject({ content: d })
}

// ============================================
// Build a PDF with JS-powered form fields
// ============================================

const document = new PdfDocument()

// Font
const font = new PdfDictionary()
font.set('Type', new PdfName('Font'))
font.set('Subtype', new PdfName('Type1'))
font.set('BaseFont', new PdfName('Helvetica'))
const fontObj = new PdfIndirectObject({ content: font })
document.add(fontObj)

// Resources
const resources = new PdfDictionary()
const fontDict = new PdfDictionary()
fontDict.set('F1', fontObj.reference)
resources.set('Font', fontDict)
const resourcesObj = new PdfIndirectObject({ content: resources })
document.add(resourcesObj)

// Content stream with labels
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: `BT
/F1 18 Tf 72 720 Td (Invoice - JS Actions Demo) Tj
/F1 12 Tf 0 -50 Td (Price:) Tj
0 -30 Td (Quantity:) Tj
0 -30 Td (Total:) Tj
0 -40 Td (Phone:) Tj
ET `,
    }),
})
document.add(contentStream)

// Page
const page = createPage(contentStream.reference)
page.content.set('Resources', resourcesObj.reference)
document.add(page)

// Form fields with JavaScript actions:

// Price field — formats as currency via AFNumber_Format
const priceField = createTextField(
    'Price',
    page.reference,
    [150, 655, 350, 675],
    'AFNumber_Format(2, 0, 0, 0, "$", true)',
)
document.add(priceField)

// Quantity field — plain number format
const qtyField = createTextField(
    'Quantity',
    page.reference,
    [150, 625, 350, 645],
    'AFNumber_Format(0, 0, 0, 0, "", false)',
)
document.add(qtyField)

// Total field — calculated as Price * Quantity via AFSimple_Calculate
const totalField = createTextField(
    'Total',
    page.reference,
    [150, 595, 350, 615],
    'AFNumber_Format(2, 0, 0, 0, "$", true)',
    'AFSimple_Calculate("PRD", ["Price", "Quantity"])',
)
document.add(totalField)

// Phone field — formatted via AFSpecial_Format (phone)
const phoneField = createTextField(
    'Phone',
    page.reference,
    [150, 555, 350, 575],
    'AFSpecial_Format(2)',
)
document.add(phoneField)

// Annotations on page
page.content.set(
    'Annots',
    new PdfArray([
        priceField.reference,
        qtyField.reference,
        totalField.reference,
        phoneField.reference,
    ]),
)

// Pages / catalog
const pages = createPages([page])
page.content.set('Parent', pages.reference)
document.add(pages)

const catalog = createCatalog(pages.reference)

// AcroForm with fields and calculation order
const acroForm = new PdfDictionary()
acroForm.set(
    'Fields',
    new PdfArray([
        priceField.reference,
        qtyField.reference,
        totalField.reference,
        phoneField.reference,
    ]),
)
// Calculation order — Total depends on Price and Quantity
acroForm.set('CO', new PdfArray([totalField.reference]))
acroForm.set('NeedAppearances', new PdfBoolean(true))

// Form default resources
const formResources = new PdfDictionary()
const formFontDict = new PdfDictionary()
const helvetica = new PdfDictionary()
helvetica.set('Type', new PdfName('Font'))
helvetica.set('Subtype', new PdfName('Type1'))
helvetica.set('BaseFont', new PdfName('Helvetica'))
const helveticaObj = new PdfIndirectObject({ content: helvetica })
document.add(helveticaObj)
formFontDict.set('Helv', helveticaObj.reference)
formResources.set('Font', formFontDict)
acroForm.set('DR', formResources)
acroForm.set('DA', new PdfString('/Helv 12 Tf 0 g'))

const acroFormObj = new PdfIndirectObject({ content: acroForm })
document.add(acroFormObj)
catalog.content.set('AcroForm', acroFormObj.reference)
document.add(catalog)
document.trailerDict.set('Root', catalog.reference)

await document.finalize()
await fs.writeFile(`${tmpFolder}/js-actions-form.pdf`, document.toBytes())
console.log('Created js-actions-form.pdf with JavaScript action fields')

// ============================================
// Fill the form with the JS engine enabled
// ============================================

const formBytes = await fs.readFile(`${tmpFolder}/js-actions-form.pdf`)
const filledDoc = await PdfDocument.fromBytes([formBytes])
const form = filledDoc.acroform!

// Attach the JS engine with a field value resolver for AFSimple_Calculate
form.jsEngine = new PdfJavaScriptEngine({
    getFieldValue: (name) => {
        const field = form.fields.find((f) => f.name === name)
        return field?.value ?? ''
    },
})

// Set values — JS format actions fire automatically
form.setValues({
    Price: '49.99',
    Quantity: '3',
    Phone: '5551234567',
})

// Print resulting values (after JS actions have run)
console.log('\nField values after JS actions:')
for (const field of form.fields) {
    console.log(`  ${field.name}: "${field.value}"`)
}
// Expected output:
//   Price: "$49.99"
//   Quantity: "3"
//   Total: "$149.97"  (calculated via AFSimple_Calculate PRD)
//   Phone: "(555) 123-4567"  (formatted via AFSpecial_Format)

await fs.writeFile(`${tmpFolder}/js-actions-filled.pdf`, filledDoc.toBytes())
console.log('\nCreated js-actions-filled.pdf with JS-formatted values')
```
