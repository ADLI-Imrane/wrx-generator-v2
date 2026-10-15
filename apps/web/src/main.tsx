import { homeLangFromPath } from './home/route';

const container = document.getElementById('root')!;
const lang = homeLangFromPath(window.location.pathname);

if (lang) {
  void import('./home/mount').then(({ mountHome }) => mountHome(container, lang));
} else {
  void import('./app-entry').then(({ mountApp }) => mountApp(container));
}
