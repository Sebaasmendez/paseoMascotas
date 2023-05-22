import { defineStore } from "pinia"

export const useUserStore = defineStore("user", {
    state: () => {
        return {
            user: {
                username: "",
                email: "",
                password: "",
                nombre: "",
                apellido: "",
                dni: "",
                role: ""
            }
        }
    }/*,
    actions: {
        cambiarNombre(user){
            this.user.nombre = user.nombre
        }
    }*/
})