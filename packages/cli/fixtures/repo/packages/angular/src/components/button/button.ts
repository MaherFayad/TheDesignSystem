import { buttonBase } from './button-base';
import { buttonGroupContext } from '../button-group/button-group-context';
import { host } from '../../internal/host';
import { theme } from '../../theme/theme';

export const fixtureButton = [buttonBase, buttonGroupContext, host, theme].join(' ');
