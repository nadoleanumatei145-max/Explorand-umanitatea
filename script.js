document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const pdfViewer = document.getElementById('pdf-viewer');
    const pdfFrame = document.getElementById('pdf-frame');
    const closePdf = document.getElementById('close-pdf');
    const searchInput = document.getElementById('search-input');

    let projectsData = [];

    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    async function generateThumbnail(pdfUrl, cardElement) {
        try {
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            
            const viewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            const thumbnailUrl = canvas.toDataURL();
            const imgContainer = cardElement.querySelector('.card-image');
            imgContainer.style.backgroundImage = `url(${thumbnailUrl})`;
            imgContainer.classList.add('loaded');
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            // Hide loader even on error
            cardElement.querySelector('.loader').style.display = 'none';
        }
    }

    function openPDF(location) {
        pdfFrame.src = `${location}#toolbar=0`;
        pdfViewer.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closePDFViewer() {
        pdfViewer.style.display = 'none';
        pdfFrame.src = '';
        document.body.style.overflow = 'auto';
    }

    function renderCards(projects) {
        container.innerHTML = '';
        
        if (projects.length === 0) {
            container.innerHTML = '<div class="no-results">Nu am găsit niciun proiect care să corespundă căutării.</div>';
            return;
        }

        projects.forEach((pdf, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            // Staggered animation delay
            card.style.animationDelay = `${index * 0.1}s`;

            card.innerHTML = `
                <div class="card-image">
                    <div class="loader"></div>
                </div>
                <div class="card-content">
                    <h2>${pdf.name}</h2>
                    <p>${pdf.description}</p>
                    <div class="hor">
                        <h4>${pdf.type}</h4>
                        <button class="open-btn">Deschide</button>
                    </div>
                </div>
            `;

            card.querySelector('.open-btn').addEventListener('click', () => {
                openPDF(pdf.location);
            });

            container.appendChild(card);
            generateThumbnail(pdf.location, card);
        });
    }

    closePdf.addEventListener('click', closePDFViewer);

    // Search logic
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = projectsData.filter(project => 
            project.name.toLowerCase().includes(searchTerm) || 
            project.description.toLowerCase().includes(searchTerm)
        );
        renderCards(filtered);
    });

    fetch('pdfs.json')
        .then(response => response.json())
        .then(data => {
            projectsData = Object.values(data);
            renderCards(projectsData);
        })
        .catch(error => console.error('Error loading PDFs:', error));
});