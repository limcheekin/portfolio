# Portfolio of Lim Chee Kin - AI Engineer & Solution Architect

This is the source code for my personal portfolio website, showcasing my skills, experience, and projects. The portfolio is built with React, TypeScript, and Tailwind CSS, and it is deployed on GitHub Pages.

## Live Demo

[https://limcheekin.github.io/portfolio/](https://limcheekin.github.io/portfolio/)

## About

This portfolio provides a comprehensive overview of my 25+ years of experience in the software industry, with a current focus on AI engineering. It details my expertise in building and leading multinational teams to deliver complex software solutions, architecting open-source AI, local AI infrastructure, and data sovereignty solutions, particularly for mobile-first web applications.

## Built With

* [React](https://reactjs.org/)
* [TypeScript](https://www.typescriptlang.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Vite](https://vitejs.dev/)
* [React Router](https://reactrouter.com/)
* [Feather Icons](https://feathericons.com/)

## Features

* **Single-Page Application (SPA):** A seamless user experience with smooth navigation and transitions.
* **Responsive Design:** Optimized for a variety of devices, including desktops, tablets, and mobile phones.
* **Component-Based Architecture:** A modular and maintainable codebase with reusable components.
* **Dark Mode:** A visually appealing dark theme for a comfortable viewing experience.
* **CI/CD Pipeline:** Automated deployment to GitHub Pages using GitHub Actions.

## Installation

To get a local copy up and running, follow these simple steps:

1.  Clone the repo
    ```sh
    git clone https://github.com/limcheekin/portfolio.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  Run the development server
    ```sh
    npm run dev
    ```

## Deployment

The portfolio is automatically deployed to GitHub Pages whenever there is a push to the `main` branch. The deployment workflow is defined in the `.github/workflows/deploy.yaml` file.

The workflow performs the following steps:
1.  Checks out the code
2.  Sets up Node.js
3.  Installs dependencies
4.  Builds the project
5.  Copies the resume PDF and images to the `dist` folder
6.  Deploys the `dist` folder to the `gh-pages` branch

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Lim Chee Kin - [@limcheekin](https://www.linkedin.com/in/limcheekin/) - limcheekin@vobject.com

Project Link: [https://github.com/limcheekin/portfolio](https://github.com/limcheekin/portfolio)

## Acknowledgements

* [Brittany Chiang's Portfolio](https://github.com/bchiang7/v4)
* [README.md Template](https://github.com/othneildrew/Best-README-Template)
