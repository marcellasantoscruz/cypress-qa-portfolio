import 'cypress-mochawesome-reporter/register'
import 'cypress-axe'
import { register as registerCypressGrep } from '@cypress/grep'

import './commands/ui'
import './commands/api'
import './commands/security'
import './commands/a11y'

registerCypressGrep()
