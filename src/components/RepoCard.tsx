import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faCodeBranch, faEye } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

export interface Repo {
    name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
    watchers_count?: number;
    language: string | null;
    updated_at: string;
}

interface RepoCardProps {
    repo: Repo;
}

function RepoCard({ repo }: RepoCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    };

    return (
        <div className="col-md-6 col-lg-4 my-2">
            <div className="card h-100 bg-dark text-white mx-1 shadow">
                <div className="card-body d-flex flex-column">
                    <h5 className="card-title">
                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-white text-decoration-none">
                            {repo.name}
                        </a>
                    </h5>
                    <p className="card-text flex-grow-1">
                        {repo.description || <span className="text-muted">No description</span>}
                    </p>
                    <div className="mt-auto">
                        <div className="d-flex flex-wrap align-items-center text-muted small mb-2">
                            {repo.language && (
                                <span className="me-3">
                                    <span className="badge bg-secondary">{repo.language}</span>
                                </span>
                            )}
                            <span className="me-3" title="Stars">
                                <FontAwesomeIcon icon={faStar} className="me-1 text-warning" />
                                {repo.stargazers_count}
                            </span>
                            <span className="me-3" title="Forks">
                                <FontAwesomeIcon icon={faCodeBranch} className="me-1" />
                                {repo.forks_count}
                            </span>
                            {repo.watchers_count !== undefined && (
                                <span title="Watchers">
                                    <FontAwesomeIcon icon={faEye} className="me-1" />
                                    {repo.watchers_count}
                                </span>
                            )}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                                Updated {formatDate(repo.updated_at)}
                            </small>
                            <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-light">
                                <FontAwesomeIcon icon={faGithub} className="me-1" />
                                View
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RepoCard;