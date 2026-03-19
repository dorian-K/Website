import React from "react";

const CV_PDF_URL = "https://raw.githubusercontent.com/dorian-K/cv/main/cv_english.pdf";

function CvPage() {
    return (
        <div className="container mt-4">
            <h1 className="text-white mb-4">Curriculum Vitae</h1>
            <div className="card bg-dark text-white">
                <div className="card-body">
                    <p className="card-text">
                        This is my CV, automatically fetched from the <a href="https://github.com/dorian-K/cv" target="_blank" rel="noopener noreferrer">CV repository</a>.
                        The PDF updates whenever the repository is updated.
                    </p>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                        <a href={CV_PDF_URL} className="btn btn-primary" download>
                            Download PDF (English)
                        </a>
                        <a href="https://raw.githubusercontent.com/dorian-K/cv/main/cv_german.pdf" className="btn btn-secondary" download>
                            Download PDF (German)
                        </a>
                        <a href="https://github.com/dorian-K/cv" className="btn btn-outline-light" target="_blank" rel="noopener noreferrer">
                            View Source on GitHub
                        </a>
                    </div>
                </div>
            </div>
            <div className="mt-4">
                <div className="card bg-dark">
                    <div className="card-body p-0">
                        <iframe
                            src={CV_PDF_URL}
                            title="CV PDF Viewer"
                            width="100%"
                            height="800px"
                            style={{ border: "none" }}
                        />
                    </div>
                </div>
            </div>
            <div className="mt-4 text-muted small">
                <p>
                    If the PDF does not load, you can <a href={CV_PDF_URL} target="_blank" rel="noopener noreferrer">open it directly</a>.
                    The CV is maintained in a separate repository; changes there will automatically reflect here.
                </p>
            </div>
        </div>
    );
}

export default CvPage;