import PaseoModel from '../model/DAOs/paseosModel.js'
import UserModel from '../model/DAOs/usersModel.js'
import DisponibilidadModel from '../model/DAOs/disponibilidadesModel.js'
import MascotaModel from '../model/DAOs/mascotasModel.js'
import PaseoValidate from '../validations/paseos.js'
import nodemailer from 'nodemailer'
import config from '../config.js'

class ServicePaseo {
  constructor() {
    this.modelPaseo = new PaseoModel()
    this.modelUser = new UserModel()
    this.modelDisponibilidad = new DisponibilidadModel()
    this.modelMascota = new MascotaModel()
    this.validatePaseo = new PaseoValidate()
  }

  getFechaActual = () => {
    const fecha = new Date()
    const day = fecha.getDate()
    const month = fecha.getMonth() + 1
    const year = fecha.getFullYear()

    return `${day}/${month}/${year}`
  }

  convertFecha = fecha => {
    let fechaSplit = fecha.split('/')
    let date = new Date(fechaSplit[1] + "/" + fechaSplit[0] + "/" + fechaSplit[2]);
    return date;
  }

  agregarDatosPersona = (id, usuarios) => {
    const usuario = usuarios.find(u => u._id.toString() === id)
    let nombrePersona = usuario.nombre
    let apellidoPersona = usuario.apellido
    let dniPersona = usuario.dni
    let telefonoPersona = usuario.telefono
    let emailPersona = usuario.email
    let direccionPersona = usuario.direccion

    return {
      nombrePersona,
      apellidoPersona,
      dniPersona,
      telefonoPersona,
      emailPersona,
      direccionPersona
    }
  }

  agregarDatosMascota = (id, mascotas) => {
    const mascota = mascotas.find(m => m._id.toString() === id)
    let nombreMascota = mascota.name

    return { nombreMascota }
  }

  filtrarPorRole = (role, id, paseos, usuarios, mascotas) => {
    let paseosFilter = []

    if (role == 'CLIENTE') {
      paseos = paseos.filter(p => p.clienteId == id)
      paseos.forEach(p => {
        let persona = this.agregarDatosPersona(p.paseadorId, usuarios)
        let mascota = this.agregarDatosMascota(p.mascotaId, mascotas)
        p = { ...p, ...persona, ...mascota }
        p = { ...p, ...persona }
        paseosFilter.push(p)
      })
    } else if (role == 'PASEADOR') {
      paseos = paseos.filter(p => p.paseadorId == id)
      paseos.forEach(p => {
        let persona = this.agregarDatosPersona(p.clienteId, usuarios)
        let mascota = this.agregarDatosMascota(p.mascotaId, mascotas)
        p = { ...p, ...persona, ...mascota }
        p = { ...p, ...persona }
        paseosFilter.push(p)
      })
    }

    return paseosFilter
  }

  compareFechaHorario(a, b) {
    const dateTimeA = `${a.fecha} ${a.horario}`
    const dateTimeB = `${b.fecha} ${b.horario}`
    return dateTimeA.localeCompare(dateTimeB)
  }

  obtenerPaseosProgramados = async (role, id) => {
    try {
      const usuarios = await this.modelUser.obtenerUsuarios()
      const mascotas = await this.modelMascota.obtenerMascotas()
      const fecha = this.getFechaActual()
      let paseos = await this.modelPaseo.obtenerPaseos()

      paseos = this.filtrarPorRole(role, id, paseos, usuarios, mascotas)      
      paseos = paseos.filter(p => new Date(this.convertFecha(p.fecha)) >= new Date(this.convertFecha(fecha)))
      paseos = paseos.sort((a, b) => this.compareFechaHorario(a, b))

      return paseos
    } catch (error) {
      console.log('Error en ServicePaseo.obtenerPaseosProgramados() --> ', error)
      return []
    }
  }

  obtenerPaseosHistorial = async (role, id) => {
    try {
      const usuarios = await this.modelUser.obtenerUsuarios()
      const mascotas = await this.modelMascota.obtenerMascotas()
      const fecha = this.getFechaActual()
      let paseos = await this.modelPaseo.obtenerPaseos()

      paseos = this.filtrarPorRole(role, id, paseos, usuarios, mascotas)
      paseos = paseos.filter(p => new Date(this.convertFecha(p.fecha)) < new Date(this.convertFecha(fecha)))
      paseos = paseos.sort((a, b) => this.compareFechaHorario(a, b))

      return paseos
    } catch (error) {
      console.log('Error en ServicePaseo.obtenerPaseosHistorial() --> ', error)
      return []
    }
  }

  sendEmailContratacion = async (paseador, cliente, paseo, mascota) => {
    try {
      const dia = `${paseo.fecha} ${paseo.horario}hs`
      const emailConfig = {
        service: 'Gmail',
        auth: {
          user: config.GMAIL_USER,
          pass: config.GMAIL_PASSWORD
        }
      }
      const mailOptions = {
        from: config.GMAIL_USER,
        to: [paseador.email, cliente.email],
        subject: `Paseo de Mascotas - Paseo contratado el dia ${dia}`,
        html: `<p>Se contrato el paseo para el dia ${dia} por el precio total de $${paseo.total}.</p>
                <a>&nbsp; <b>Contratado por:</b> ${cliente.apellido}, ${cliente.nombre} - ${cliente.dni}</a><br>
                <a>&nbsp; <b>Mascota asignada:</b> Se llama <b>${mascota.name}</b> - ${mascota.breed}</a><br>
                <a>&nbsp; <b>Direccion de retiro:</b> ${cliente.direccion}</a><br>
                <a>&nbsp; <b>Datos de contacto del contratador:</b> ${cliente.email} - ${cliente.telefono}</a><br><br>
                <p>&copy; 2023 Paseo de Mascotas. Todos los derechos reservados.</p>`
      }

      const transporter = nodemailer.createTransport(emailConfig)
      await transporter.sendMail(mailOptions)
    } catch (error) {
      console.log('Error in ServicePaseo.sendEmailContratacion() -->', error)
    }
  }

  guardarPaseo = async paseo => {
    try {
      //Aplicar descuento a cliente
      const cliente = await this.modelUser.obtenerUsuarios(paseo.clienteId)
      const clienteActualizado = {
        saldo: parseFloat(cliente.saldo) - parseFloat(paseo.total)
      }
      let clienteModified = await this.modelUser.actualizarUsuario(
        cliente._id,
        clienteActualizado
      )

      //Aplicar acreditacion a paseador
      const paseador = await this.modelUser.obtenerUsuarios(paseo.paseadorId)
      const paseadorActualizado = {
        saldo: parseFloat(paseador.saldo) + parseFloat(paseo.total)
      }
      let paseadorModified = await this.modelUser.actualizarUsuario(
        paseador._id,
        paseadorActualizado
      )

      //Obtener Mascota
      const mascota = await this.modelMascota.obtenerMascotasById(
        paseo.mascotaId
      )

      //Cambiar estado de la disponibilidad
      const paseadorDispo =
        await this.modelDisponibilidad.obtenerDisponibilidadesById(
          paseo.disponibilidadId
        )
      const dispoActualizado = {
        estado: 1 // 0 = Disponible - 1 = Contratado
      }
      let paseadorDispoModified =
        await this.modelDisponibilidad.actualizarDisponibilidad(
          paseadorDispo._id,
          dispoActualizado
        )

      //Guardar fecha del dia
      paseo.fecha = this.getFechaActual()

      //Guardar paseo
      let mensajeError = ''
      const validate = this.validatePaseo.validarPaseo(paseo)

      if (validate.respuesta) {
        const paseoSaved = await this.modelPaseo.guardarPaseo(paseo)
        //const verificationToken = crypto.randomBytes(20).toString('hex')

        //Enviar mail a paseador y cliente
        await this.sendEmailContratacion(
          paseadorModified,
          clienteModified,
          paseoSaved,
          mascota
        )

        return paseoSaved
      } else {
        mensajeError = 'Error al grabar el paseo.'
        console.log(mensajeError)
        return { respuesta: validate.respuesta, error: mensajeError }
      }
    } catch (error) {
      console.log('Error en ServicePaseo.guardarPaseo() --> ', error)
      return {}
    }
  }

  calificarPaseo = async (id, calificacion) => {
    try {
      const paseo = await this.modelPaseo.obtenerPaseoById(id)
      if (!paseo) {
        throw new Error('Paseo not found')
      }

      paseo.calificacion = calificacion
      await this.modelPaseo.actualizarPaseo(id, paseo)

      return { message: 'Calificación saved successfully' }
    } catch (error) {
      console.log('Error in ServicePaseo.calificarPaseo() -->', error)
      throw error
    }
  }
}

export default ServicePaseo
