import React, { useState, useEffect } from "react";
import RepoCard, { Repo } from "./RepoCard";

const GITHUB_API_URL = "https://api.github.com/users/dorian-K/repos?sort=updated&per_page=20";

function ProjectsSection() {
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRepos = async () => {
            try {
                const response = await fetch(GITHUB_API_URL);
                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }
                const data = await response.json();
                // Filter out forks? maybe keep all.
                // Sort by stars descending
                const sorted = data
                    .filter((repo: any) => !repo.fork) // exclude forks
                    .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
                    .slice(0, 6); // top 6
                setRepos(sorted);
            } catch (err: any) {
                console.error("Failed to fetch repositories:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRepos();
    }, []);

    if (loading) {
        return (
            <div className="container my-5">
                <h2 className="text-white text-center mb-4">GitHub Projects</h2>
                <div className="d-flex justify-content-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading repositories...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container my-5">
                <h2 className="text-white text-center mb-4">GitHub Projects</h2>
                <div className="alert alert-warning text-center" role="alert">
                    Unable to load repositories: {error}. <br />
                    Please check the console for details.
                </div>
            </div>
        );
    }

    return (
        <div className="container my-5">
            <h2 className="text-white text-center mb-4">GitHub Projects</h2>
            <p className="text-white-50 text-center mb-5">
                A selection of my public repositories. Sorted by stars.
            </p>
            <div className="row">
                {repos.length > 0 ? (
                    repos.map((repo) => (
                        <RepoCard key={repo.name} repo={repo} />
                    ))
                ) : (
                    <div className="col-12">
                        <p className="text-white text-center">No repositories found.</p>
                    </div>
                )}
            </div>
            <div className="text-center mt-4">
                <a href="https://github.com/dorian-K" target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-lg">
                    View All on GitHub
                </a>
            </div>
        </div>
    );
}

export default ProjectsSection;