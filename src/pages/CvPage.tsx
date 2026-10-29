import { useEffect } from "react";

export const CV_PDF_URL = "https://raw.githubusercontent.com/dorian-K/cv/main/cv_dorian_koch.pdf";

function CvPage() {
	useEffect(() => {
		window.location.replace(CV_PDF_URL);
	}, []);

	return null;
}

export default CvPage;
