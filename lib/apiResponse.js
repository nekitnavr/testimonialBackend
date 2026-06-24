class ApiResponse {
    constructor(code = 200, status = 'success', message = '', data = {}){
        this.code = code
        this.status = status
        this.message = message
        this.data = data
    }

    static success(message = '', data={}){
        return new ApiResponse(200, 'success', message, data)
    }

    static failure(message = '', data={}, code = 500){
        return new ApiResponse(code, 'failure', message, data)
    }

    static created(message = '', data={}){
        return new ApiResponse(201, 'success', message, data)
    }

    static badRequest(res, message = '', data={}){
        return res.status(400).send(new ApiResponse(400, 'failure', message, data)) 
    }

    static unauthorized(res, message = '', data={}){
        return res.status(401).send(new ApiResponse(401, 'failure', message, data))
    }
}

module.exports = ApiResponse