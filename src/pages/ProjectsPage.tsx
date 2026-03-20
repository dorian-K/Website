import React from "react";
import ProjectsSection from "../components/ProjectsSection";

function ProjectsPage() {
    return (
        <div className="mt-4">
            <h1 className="text-white mb-4">GitHub Projects</h1>
            <p className="text-white-50 mb-5">
                This page shows a selection of my public GitHub repositories, sorted by stars.
                The data is fetched directly from the GitHub API and updates automatically.
            </p>
            <ProjectsSection />
        </div>
    );
}

export default ProjectsPage;