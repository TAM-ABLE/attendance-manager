import { Hono } from 'hono'
import { cors } from 'hono/cors';
import loginRouter from './login'

const auth = new Hono()

auth.use('*', cors());

auth.route('/login', loginRouter)

export default auth