import React, { useState, useEffect } from "react";

const CV_PDF_URL = "https://raw.githubusercontent.com/dorian-K/cv/main/cv_english.pdf";
const CV_GERMAN_URL = "https://raw.githubusercontent.com/dorian-K/cv/main/cv_german.pdf";
const CV_REPO_URL = "https://github.com/dorian-K/cv";
const GITHUB_API_URL = "https://api.github.com/repos/dorian-K/cv/commits?per_page=1";

function CvPage() {
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [loadingTimestamp, setLoadingTimestamp] = useState(true);

    useEffect(() => {
        const fetchLastUpdated = async () => {
            try {
                const response = await fetch(GITHUB_API_URL);
                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }
                const commits = await response.json();
                if (Array.isArray(commits) && commits.length > 0) {
                    const commitDate = new Date(commits[0].commit.author.date);
                    // Format as "January 24, 2026"
                    const formatted = commitDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    });
                    setLastUpdated(formatted);
                } else {
                    throw new Error("No commits found");
                }
            } catch (err: any) {
                console.error("Failed to fetch last updated timestamp:", err);
                setFetchError(err.message);
            } finally {
                setLoadingTimestamp(false);
            }
        };

        fetchLastUpdated();
    }, []);

    return (
        <div className="container mt-4">
            <h1 className="text-white mb-4">Curriculum Vitae</h1>
            
            {/* Intro card */}
            <div className="card bg-dark text-white shadow-lg mb-4">
                <div className="card-body">
                    <p className="card-text">
                        This is my CV, automatically fetched from the <a href={CV_REPO_URL} target="_blank" rel="noopener noreferrer">CV repository</a>.
                        The PDF updates whenever the repository is updated.
                    </p>
                    <div className="d-flex flex-wrap gap-3 mb-2">
                        <a href={CV_PDF_URL} className="btn btn-primary btn-lg" download>
                            Download PDF (English)
                        </a>
                        <a href={CV_GERMAN_URL} className="btn btn-secondary btn-lg" download>
                            Download PDF (German)
                        </a>
                        <a href={CV_REPO_URL} className="btn btn-outline-light btn-lg" target="_blank" rel="noopener noreferrer">
                            View Source on GitHub
                        </a>
                    </div>
                </div>
            </div>

            {/* PDF viewer */}
            <div className="card bg-dark shadow-lg">
                <div className="card-header text-white border-bottom border-secondary">
                    <h5 className="mb-0">PDF Preview</h5>
                </div>
                <div className="card-body p-0 position-relative">
                    {!iframeLoaded && (
                        <div className="d-flex justify-content-center align-items-center cv-iframe-loading">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading PDF...</span>
                            </div>
                        </div>
                    )}
                    <iframe
                        src={CV_PDF_URL}
                        title="CV PDF Viewer"
                        width="100%"
                        className="cv-iframe"
                        style={{ border: "none", display: iframeLoaded ? "block" : "none" }}
                        onLoad={() => setIframeLoaded(true)}
                    />
                </div>
                <div className="card-footer text-muted small border-top border-secondary">
                    <p className="mb-0">
                        If the PDF does not load, you can <a href={CV_PDF_URL} target="_blank" rel="noopener noreferrer">open it directly</a>.
                        The CV is maintained in a separate repository; changes there will automatically reflect here.
                    </p>
                </div>
            </div>

            {/* Last updated note */}
            <div className="mt-4 text-muted small text-center">
                <p className="mb-0">
                    Last updated:{" "}
                    {loadingTimestamp ? (
                        <span className="fw-semibold">
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            fetching…
                        </span>
                    ) : fetchError ? (
                        <span className="fw-semibold text-warning">Unable to fetch timestamp ({fetchError})</span>
                    ) : lastUpdated ? (
                        <span className="fw-semibold">{lastUpdated}</span>
                    ) : (
                        <span className="fw-semibold">Unknown</span>
                    )}
                </p>
            </div>
        </div>
    );
}

export default CvPage;