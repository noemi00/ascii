// Apply Sobel filter to get the gradient magnitude and direction (edge detection)
function applySobel(imageData, width, height) {
    const sobelData = [];
    const directions = [];
    const kernelX = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
    ];
    const kernelY = [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1]
    ];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let pixelX = 0;
            let pixelY = 0;

            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const px = Math.min(Math.max(x + kx, 0), width - 1);
                    const py = Math.min(Math.max(y + ky, 0), height - 1);
                    const offset = (py * width + px) * 4;
                    const gray = (imageData[offset] + imageData[offset + 1] + imageData[offset + 2]) / 3;

                    pixelX += gray * kernelX[ky + 1][kx + 1];
                    pixelY += gray * kernelY[ky + 1][kx + 1];
                }
            }

            const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);
            const direction = Math.atan2(pixelY, pixelX) * (180 / Math.PI); // Direction in degrees

            sobelData.push(magnitude);
            directions.push(direction);
        }
    }

    return { sobelData, directions };
}

// Convert angle to corresponding ASCII character for edge direction
function directionToAsciiChar(angle) {
    if (angle >= -22.5 && angle < 22.5) {
        return "-";  // Horizontal edge
    } else if (angle >= 22.5 && angle < 67.5) {
        return "\\"; // Diagonal right
    } else if (angle >= 67.5 && angle < 112.5) {
        return "|";  // Vertical edge
    } else if (angle >= 112.5 && angle < 157.5) {
        return "/";  // Diagonal left
    } else if (angle >= 157.5 || angle < -157.5) {
        return "-";  // Horizontal edge
    } else if (angle >= -157.5 && angle < -112.5) {
        return "\\"; // Diagonal right (negative)
    } else if (angle >= -112.5 && angle < -67.5) {
        return "|";  // Vertical edge
    } else if (angle >= -67.5 && angle < -22.5) {
        return "/";  // Diagonal left (negative)
    } else {
        return " ";  // No edge
    }
}

function imageToAscii(image, width = 100, enableEdgeDetection = false, edgeSensitivity = 100) {
    const asciiCharacters = " .:-=+*%@#";
    const aspectRatio = image.height / image.width;
    const height = Math.round(width * aspectRatio * 0.55); // Adjusted height scaling for ASCII characters

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let ascii = "";

    // Apply Sobel edge detection if enabled
    let sobelData, directions;
    if (enableEdgeDetection) {
        const sobelResult = applySobel(imageData, canvas.width, canvas.height);
        sobelData = sobelResult.sobelData;
        directions = sobelResult.directions;
    }

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const offset = (y * canvas.width + x) * 4;
            const r = imageData[offset];
            const g = imageData[offset + 1];
            const b = imageData[offset + 2];
            const avg = (r + g + b) / 3;

            if (enableEdgeDetection) {
                const edgeValue = sobelData[y * canvas.width + x];
                // Adjust sensitivity scaling to be smoother and less abrupt
                if (edgeValue > edgeSensitivity) {
                    const angle = directions[y * canvas.width + x];
                    ascii += directionToAsciiChar(angle);
                } else {
                    const charIndex = Math.floor((avg / 255) * (asciiCharacters.length - 1));
                    ascii += asciiCharacters[charIndex];
                }
            } else {
                const charIndex = Math.floor((avg / 255) * (asciiCharacters.length - 1));
                ascii += asciiCharacters[charIndex];
            }
        }
        ascii += '\n';
    }

    return ascii;
}



// Handle file upload and conversion
document.getElementById('imageUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const image = new Image();
        image.onload = function() {
            const enableEdgeDetection = document.getElementById('toggle-edges').checked;
            const edgeSensitivity = parseInt(document.getElementById('edgeSensitivity').value, 10);
            const asciiArt = imageToAscii(image, 100, enableEdgeDetection, edgeSensitivity);
            document.getElementById('asciiOutput').textContent = asciiArt;
        }
        image.src = e.target.result;
    }

    reader.readAsDataURL(file);
});

document.getElementById('toggle-edges').addEventListener('change', function() {
    document.getElementById('imageUpload').dispatchEvent(new Event('change'));
});

document.getElementById('edgeSensitivity').addEventListener('input', function() {
    document.getElementById('sensitivityLabel').textContent = this.value;
    document.getElementById('imageUpload').dispatchEvent(new Event('change'));
});

