import UserService from '../services/usersService.js'

class ControllerUser {

    constructor(){
        this.service = new UserService()
    }

    loguearUsuario = async (req, res) => {
        const user = req.body
        const userLogin = await this.service.loguearUsuario(user)

        if(userLogin != null){
            res.json(userLogin)
        }else{
            res.sendStatus(400)
        }
    }

    registrarUsuario = async (req, res) => {
        const user = req.body
        const userRegistered = await this.service.registrarUsuario(user)

        if(userRegistered != null){
            res.json(userRegistered)
        }else{
            res.sendStatus(400)
        }
    }

    obtenerUsuarios = async (req, res) => {
        const { username } = req.params
        const users = await this.service.obtenerUsuarios(username)

        res.json(users)
    }

    guardarUsuario = async (req, res) => {
        const user = req.body
        const userSaved = await this.service.guardarUsuario(user)

        res.json(userSaved)
    }

    actualizarUsuario = async (req, res) => {
        const username = req.params.username
        const user = req.body
        const userUpdated = await this.service.actualizarUsuario(username, user)

        res.json(userUpdated)
    }

    eliminarUsuario = async (req, res) => {
        const username = req.params.username
        const userDeleted = await this.service.eliminarUsuario(username)

        res.json(userDeleted)
    }

}

export default ControllerUser