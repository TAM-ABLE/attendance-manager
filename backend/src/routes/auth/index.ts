import { Hono } from 'hono'
import { cors } from 'hono/cors';
import loginRouter from './login'
import registerRouter from './register'

const auth = new Hono()

auth.use('*', cors());

auth.route('/login', loginRouter)
auth.route('/register', registerRouter)

export default auth