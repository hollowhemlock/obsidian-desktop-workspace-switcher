// eslint-disable-next-line import-x/no-unassigned-import, import-x/no-empty-named-blocks -- Required to enable unofficial internal Obsidian API typings
import type {} from 'obsidian-typings'; // Do not delete this line if you want to use unofficial internal obsidian API.

import './styles/main.scss'; // Do not delete this line if you want to have a styles.css file in your build output.
import { Plugin } from './Plugin.ts';

// eslint-disable-next-line import-x/no-default-export -- Obsidian infrastructure requires a default export.
export default Plugin;
