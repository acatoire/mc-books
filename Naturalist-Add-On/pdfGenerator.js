

// Add this helper function to your code
function checkPageBreak(pdf, currentY, text, margin) {
    const pageHeight = pdf.internal.pageSize.height;
    const maxY = pageHeight - margin;
    const textHeight = pdf.getTextDimensions(text).h;

    // Check if the current content plus text height will exceed page bounds
    if (currentY + textHeight >= maxY) {
        pdf.addPage();
        return margin; // Return the top margin of the new page
    }

    return currentY; // Return the current Y if no page break needed
}


function pdfSectionTitle(i, animalList, pdf, pageWidth, margin, currentY, animalData, currentLanguage) {
    // Title section
    const animalNumber = `Animal ${i + 1}/${animalList.length}`;
    pdf.setFontSize(12);
    pdf.text(animalNumber, pageWidth - margin, currentY, {align: 'right'});

    pdf.setFontSize(20);
    const animalTitle = animalData.title?.[currentLanguage] || '';
    pdf.text(animalTitle, margin, currentY);
    currentY += 10;
    return currentY;
}

function pdfSectionDescription(animalData, currentLanguage, pdf, pageWidth, margin, currentY, extraLanguage = '') {
    // Description section
    if (animalData.description?.[currentLanguage]) {
        pdf.setFontSize(12);
        const description = pdf.splitTextToSize(
            animalData.description[currentLanguage],
            pageWidth - 2 * margin
        );
        pdf.text(description, margin, currentY);

        if (extraLanguage && animalData.description[extraLanguage]) {
            currentY += description.length * 5 + 5;
            const extraDesc = pdf.splitTextToSize(
                animalData.description[extraLanguage],
                pageWidth - 2 * margin
            );
            currentY = checkPageBreak(pdf, currentY, extraDesc, margin);

            // Draw a box around the extra description
            const textHeight = extraDesc.length * 5;
            pdf.setDrawColor(0); // Black border
            pdf.rect(margin - 2, currentY - 5, pageWidth - 2 * margin + 4, textHeight + 2);

            pdf.text(extraDesc, margin, currentY);
        }
        currentY += description.length * 5 + 5;
    }
    return currentY;
}

async function pdfSectionStats(pageWidth, margin, currentY, animalData, animalFolder, animalPrefix, animal, pdf, currentLanguage) {
    // Stats and image section
    const halfPage = (pageWidth - 2 * margin) / 2;
    const statsStartY = currentY;
    let imgHeight = 0;

    // Add GIF image on the left
    if (animalData.images?.main) {
        try {
            const img = new Image();
            img.src = `${animalFolder}${animalPrefix}${animal}/${animalData.images.main}`;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Calculate image dimensions - increase maxHeight for better resolution
            const imgMaxWidth = halfPage - margin;
            const imgMaxHeight = 80;
            const imgRatio = Math.min(imgMaxWidth / img.width, imgMaxHeight / img.height);
            const imgWidth = img.width * imgRatio;
            imgHeight = img.height * imgRatio;

            // Set canvas size to include border
            const borderWidth = 2; // Border width in pixels
            canvas.width = imgWidth + (borderWidth * 2);
            canvas.height = imgHeight + (borderWidth * 2);

            // Fill white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = borderWidth;
            ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvas.width - borderWidth, canvas.height - borderWidth);

            // Draw image inside border
            ctx.drawImage(img, borderWidth, borderWidth, imgWidth, imgHeight);

            // Use higher quality for the JPEG compression
            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            // Position image on the left side - removed scaling factor for better resolution
            pdf.addImage(imgData, 'JPEG', margin, currentY - 5, canvas.width, canvas.height);
        } catch (error) {
            console.error(`Error adding image for ${animal}:`, error);
        }
    }

    // Stats on the right
    if (animalData.stats) {
        const statsX = margin + halfPage;
        pdf.setFontSize(14);
        pdf.text("Stats:", statsX, currentY);
        currentY += 5;

        pdf.setFontSize(12);
        if (animalData.stats.classification?.[currentLanguage]) {
            pdf.text(
                `Classification: ${animalData.stats.classification[currentLanguage]}`,
                statsX,
                currentY
            );
            currentY += 5;
        }

        if (animalData.stats.health) {
            pdf.text(`Health: ${animalData.stats.health}`, statsX, currentY);
            currentY += 5;
        }

        if (animalData.stats.behavior?.[currentLanguage]) {
            pdf.text(
                `Behavior: ${animalData.stats.behavior[currentLanguage]}`,
                statsX,
                currentY
            );
            currentY += 5;
        }

        if (animalData.stats.spawn?.[currentLanguage]) {
            pdf.text(
                `Spawn: ${animalData.stats.spawn[currentLanguage]}`,
                statsX,
                currentY
            );
            currentY += 5;
        }
    }

    // Add spacing after stats/image section
    return Math.max(currentY, statsStartY + imgHeight) + 5; // Increased spacing to accommodate larger images
}

function pdfSectionSpawn(animalData, pdf, currentLanguage, margin, currentY, pageWidth) {
    // Spawning section
    if (animalData.spawning) {
        pdf.setFontSize(16);
        pdf.text(translationsPage.title.spawning[currentLanguage], margin, currentY);
        currentY += 5;

        if (animalData.spawning.description?.[currentLanguage]) {
            pdf.setFontSize(12);
            const spawnDesc = pdf.splitTextToSize(
                animalData.spawning.description[currentLanguage],
                pageWidth - 2 * margin
            );
            pdf.text(spawnDesc, margin, currentY);
            currentY += spawnDesc.length * 5 + 5;
        }

        // Add variants if they exist
        if (animalData.spawning.variants) {
            animalData.spawning.variants.forEach(variant => {
                let variantText = '';

                // Build variant text only if all required properties exist
                if (variant.type?.[currentLanguage] && variant.group && variant.biome?.[currentLanguage]) {
                    variantText = `${variant.type[currentLanguage]}: ${variant.group} (${variant.biome[currentLanguage]})`;
                    pdf.text(variantText, margin + 10, currentY);
                    currentY += 5;
                }
            });
            currentY += 5;
        }
    }
    return currentY;
}

function pdfSectionDrops(animalData, pdf, currentLanguage, margin, currentY, pageWidth) {
    // Drops section
    if (animalData.drops) {
        pdf.setFontSize(16);
        pdf.text(translationsPage.title.drops[currentLanguage], margin, currentY);
        currentY += 5;

        if (animalData.drops.description?.[currentLanguage]) {
            pdf.setFontSize(12);
            pdf.text(animalData.drops.description[currentLanguage], margin, currentY);
            currentY += 5;
        }

        // Add drop items
        if (animalData.drops.items) {
            animalData.drops.items.forEach(item => {
                let dropText = `• ${item.name[currentLanguage]}: ${item.amount}`;
                if (item.condition) {
                    dropText += ` (${item.condition[currentLanguage]})`;
                }
                pdf.text(dropText, margin + 5, currentY);
                currentY += 5;
            });
            currentY += 5;
        }

        // Add drop note if exists
        if (animalData.drops.note?.[currentLanguage]) {
            pdf.setFontSize(10);
            const noteText = pdf.splitTextToSize(
                `Note: ${animalData.drops.note[currentLanguage]}`,
                pageWidth - 2 * margin
            );
            pdf.text(noteText, margin, currentY);
            currentY += noteText.length * 5 + 5;
        }
    }
    return currentY;
}

function pdfSectionBehavior(animalData, pdf, currentLanguage, margin, currentY, pageWidth) {
    // Behavior section
    if (animalData.behavior) {
        pdf.setFontSize(16);
        pdf.text(translationsPage.title.behavior[currentLanguage], margin, currentY);
        currentY += 5;

        if (animalData.behavior.description?.[currentLanguage]) {
            pdf.setFontSize(12);
            const behaviorDesc = pdf.splitTextToSize(
                animalData.behavior.description[currentLanguage],
                pageWidth - 2 * margin
            );
            currentY = checkPageBreak(pdf, currentY, behaviorDesc, margin);
            pdf.text(behaviorDesc, margin, currentY);
            currentY += behaviorDesc.length * 5 + 5;
        }

        // Add prey information if exists
        if (animalData.behavior.prey?.[currentLanguage]) {
            pdf.text(`Prey: ${animalData.behavior.prey[currentLanguage]}`, margin, currentY);
            currentY += 10;
        }

        // Add weakness information if exists
        if (animalData.behavior.weakness?.[currentLanguage]) {
            const weaknessText = pdf.splitTextToSize(
                `Weakness: ${animalData.behavior.weakness[currentLanguage]}`,
                pageWidth - 2 * margin
            );
            currentY = checkPageBreak(pdf, currentY, weaknessText, margin);
            pdf.text(weaknessText, margin, currentY);
            currentY += weaknessText.length * 5 + 5;
        }
    }
    return currentY;
}

function pdfSectionBreeding(animalData, pdf, currentLanguage, margin, currentY, pageWidth) {
    // Breeding section
    if (animalData.breeding) {
        pdf.setFontSize(16);
        pdf.text(translationsPage.title.breeding[currentLanguage], margin, currentY);
        currentY += 5;

        if (animalData.breeding.description?.[currentLanguage]) {
            pdf.setFontSize(12);
            const breedingDesc = pdf.splitTextToSize(
                animalData.breeding.description[currentLanguage],
                pageWidth - 2 * margin
            );
            currentY = checkPageBreak(pdf, currentY, breedingDesc, margin);
            pdf.text(breedingDesc, margin, currentY);
            currentY += breedingDesc.length * 5 + 5;
        }

        // Add egg behavior if exists
        if (animalData.breeding.egg_behavior?.[currentLanguage]) {
            const eggBehaviorText = pdf.splitTextToSize(
                animalData.breeding.egg_behavior[currentLanguage],
                pageWidth - 2 * margin
            );
            currentY = checkPageBreak(pdf, currentY, eggBehaviorText, margin);
            pdf.text(eggBehaviorText, margin, currentY);
            currentY += eggBehaviorText.length * 5 + 5;
        }

        // Add behavior if exists
        if (animalData.breeding.behavior?.[currentLanguage]) {
            const behaviorText = pdf.splitTextToSize(
                animalData.breeding.behavior[currentLanguage],
                pageWidth - 2 * margin
            );
            currentY = checkPageBreak(pdf, currentY, behaviorText, margin);
            pdf.text(behaviorText, margin, currentY);
            currentY += behaviorText.length * 5 + 5;
        }
    }
    return currentY;
}

function pdfSectionTaming(animalData, pdf, currentLanguage, margin, currentY, pageWidth) {
    // taming section
    if (animalData.taming) {
        pdf.setFontSize(16);
        pdf.text(translationsPage.title.taming[currentLanguage], margin, currentY);
        currentY += 5;

        if (animalData.taming.description?.[currentLanguage]) {
            pdf.setFontSize(12);
            const tamingDesc = pdf.splitTextToSize(
                animalData.taming.description[currentLanguage],
                pageWidth - 2 * margin
            );
            currentY = checkPageBreak(pdf, currentY, tamingDesc, margin);
            pdf.text(tamingDesc, margin, currentY);
            currentY += tamingDesc.length * 5 + 5;
        }

        // Add behavior if exists
        if (animalData.taming.behavior?.[currentLanguage]) {
            const behaviorText = pdf.splitTextToSize(
                animalData.taming.behavior[currentLanguage],
                pageWidth - 2 * margin
            );
            currentY = checkPageBreak(pdf, currentY, behaviorText, margin);
            pdf.text(behaviorText, margin, currentY);
            currentY += behaviorText.length * 5 + 5;
        }
    }
    return currentY;
}

// PDF Generation functionality
async function generatePDF(animalList,
                           animalTranslations,
                           currentLanguage,
                           animalFolder,
                           animalPrefix,
                           extraLanguage = '') {
    const {jsPDF} = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 10;
    const maxY = pageHeight - margin; // Maximum Y position before needing a new page
    pdf.setFont("helvetica");

    // Create cover page
    pdf.setFontSize(24);
    pdf.text('Naturalist Add-On Guide', pageWidth / 2, pageHeight / 4, {align: 'center'});
    pdf.setFontSize(14);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight / 4 + 20, {align: 'center'});
    pdf.text(`Language: ${currentLanguage === 'en' ? 'English' : 'Français'}`, pageWidth / 2, pageHeight / 4 + 30, {align: 'center'});
    pdf.text(`Total Animals: ${animalList.length}`, pageWidth / 2, pageHeight / 4 + 40, {align: 'center'});

    // Process each animal
    for (let i = 0; i < animalList.length; i++) {
        const animal = animalList[i];
        const animalData = animalTranslations.get(animal);

        if (!animalData) {
            console.warn(`No data found for animal: ${animal}`);
            continue;
        }

        pdf.addPage();
        let currentY = 10;

        currentY = pdfSectionTitle(i, animalList, pdf, pageWidth, margin, currentY, animalData, currentLanguage);
        currentY = pdfSectionDescription(animalData, currentLanguage, pdf, pageWidth, margin, currentY, extraLanguage);
        currentY = await pdfSectionStats(pageWidth, margin, currentY, animalData, animalFolder, animalPrefix, animal, pdf, currentLanguage);
        currentY = pdfSectionSpawn(animalData, pdf, currentLanguage, margin, currentY, pageWidth);
        currentY = pdfSectionDrops(animalData, pdf, currentLanguage, margin, currentY, pageWidth);
        currentY = pdfSectionBehavior(animalData, pdf, currentLanguage, margin, currentY, pageWidth);
        currentY = pdfSectionBreeding(animalData, pdf, currentLanguage, margin, currentY, pageWidth);
        currentY = pdfSectionTaming(animalData, pdf, currentLanguage, margin, currentY, pageWidth);
    }

    // Save the PDF
    pdf.save(`naturalist_addon_guide_${currentLanguage}.pdf`);
}

// Export the function for use in other files
window.generatePDF = generatePDF;
