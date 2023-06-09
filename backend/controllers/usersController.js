import UserService from '../services/usersService.js'

class ControllerUser {
  constructor() {
    this.serviceUser = new UserService()
  }

  loguearUsuario = async (req, res) => {
    try {
      const userLogin = await this.serviceUser.loguearUsuario(
        req.params.username,
        req.params.password
      )
      if (userLogin.success) {
        res.status(200).json(userLogin.data)
      }
      if (!userLogin.success) {
        res.status(401).json({ error: userLogin.message })
      }
    } catch (error) {
      console.log('Error en ControllerUser.loguearUsuario() --> ', error)
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  registrarUsuario = async (req, res) => {
    try {
      const user = req.body
      const userRegistered = await this.serviceUser.registrarUsuario(user)
      if (userRegistered.success) {
        res.status(201).json(userRegistered.data)
      }
      if (!userRegistered.success) {
        res.status(400).json({ error: userRegistered.message })
      }
    } catch (error) {
      console.log('Error en ControllerUser.registrarUsuario() --> ', error)
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  verificarEmailUsuario = async (req, res) => {
    try {
      const token = req.params.verificationToken
      const userVerified = await this.serviceUser.validarEmailUsuario(token)

      res.status(200).json(userVerified)
    } catch (error) {
      console.log('Error in ControllerUser.verificarEmailUsuario() -->', error)
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  actualizarUsuario = async (req, res) => {
    try {
      const id = req.params.id
      const user = req.body
      const userUpdated = await this.serviceUser.actualizarUsuario(id, user)

      res.status(200).json(userUpdated)
    } catch (error) {
      console.log('Error en ControllerUser.actualizarUsuario() --> ', error)
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  eliminarUsuario = async (req, res) => {
    try {
      const id = req.params.id
      const userDeleted = await this.serviceUser.eliminarUsuario(id)

      res.status(200).json(userDeleted)
    } catch (error) {
      console.log('Error en ControllerUser.eliminarUsuario() --> ', error)
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
}

export default ControllerUser
