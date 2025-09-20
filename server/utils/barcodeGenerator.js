const QRCode = require('qrcode');
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');

// Generate QR Code for books
const generateBookQRCode = async (bookId, bookTitle) => {
    try {
        const qrData = {
            type: 'book',
            id: bookId,
            title: bookTitle,
            timestamp: new Date().toISOString()
        };

        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return qrCodeDataURL;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
};

// Generate Barcode for books
const generateBookBarcode = (isbn) => {
    try {
        const canvas = createCanvas(200, 100);
        JsBarcode(canvas, isbn, {
            format: 'EAN13',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 10
        });

        return canvas.toDataURL();
    } catch (error) {
        console.error('Error generating barcode:', error);
        throw error;
    }
};

// Generate QR Code for users
const generateUserQRCode = async (userId, userInfo) => {
    try {
        const qrData = {
            type: 'user',
            id: userId,
            name: `${userInfo.firstName} ${userInfo.lastName}`,
            studentId: userInfo.studentId,
            timestamp: new Date().toISOString()
        };

        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return qrCodeDataURL;
    } catch (error) {
        console.error('Error generating user QR code:', error);
        throw error;
    }
};

// Generate library card barcode
const generateLibraryCardBarcode = (studentId) => {
    try {
        const canvas = createCanvas(300, 100);
        JsBarcode(canvas, studentId, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 10
        });

        return canvas.toDataURL();
    } catch (error) {
        console.error('Error generating library card barcode:', error);
        throw error;
    }
};

// Generate QR Code for borrow transactions
const generateBorrowQRCode = async (borrowId, bookTitle, dueDate) => {
    try {
        const qrData = {
            type: 'borrow',
            id: borrowId,
            book: bookTitle,
            dueDate: dueDate,
            timestamp: new Date().toISOString()
        };

        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return qrCodeDataURL;
    } catch (error) {
        console.error('Error generating borrow QR code:', error);
        throw error;
    }
};

// Generate QR Code for reservations
const generateReservationQRCode = async (reservationId, bookTitle, priority) => {
    try {
        const qrData = {
            type: 'reservation',
            id: reservationId,
            book: bookTitle,
            priority: priority,
            timestamp: new Date().toISOString()
        };

        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return qrCodeDataURL;
    } catch (error) {
        console.error('Error generating reservation QR code:', error);
        throw error;
    }
};

// Generate library location QR code
const generateLocationQRCode = async (location) => {
    try {
        const qrData = {
            type: 'location',
            section: location.section,
            shelf: location.shelf,
            position: location.position,
            timestamp: new Date().toISOString()
        };

        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 150,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return qrCodeDataURL;
    } catch (error) {
        console.error('Error generating location QR code:', error);
        throw error;
    }
};

// Generate bulk QR codes for books
const generateBulkBookQRCodes = async (books) => {
    try {
        const qrCodes = [];

        for (const book of books) {
            const qrCode = await generateBookQRCode(book._id, book.title);
            qrCodes.push({
                bookId: book._id,
                title: book.title,
                qrCode: qrCode
            });
        }

        return qrCodes;
    } catch (error) {
        console.error('Error generating bulk QR codes:', error);
        throw error;
    }
};

// Generate library card with QR code and barcode
const generateLibraryCard = async (user) => {
    try {
        const qrCode = await generateUserQRCode(user._id, user);
        const barcode = generateLibraryCardBarcode(user.studentId);

        return {
            qrCode,
            barcode,
            user: {
                name: `${user.firstName} ${user.lastName}`,
                studentId: user.studentId,
                email: user.email,
                role: user.role
            }
        };
    } catch (error) {
        console.error('Error generating library card:', error);
        throw error;
    }
};

module.exports = {
    generateBookQRCode,
    generateBookBarcode,
    generateUserQRCode,
    generateLibraryCardBarcode,
    generateBorrowQRCode,
    generateReservationQRCode,
    generateLocationQRCode,
    generateBulkBookQRCodes,
    generateLibraryCard
};
