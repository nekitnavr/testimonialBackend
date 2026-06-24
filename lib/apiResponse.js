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

    static failure(message = '', code = 500, data={}){
        return new ApiResponse(code, 'failure', message, data)
    }

    static created(message = '', data={}){
        return new ApiResponse(201, 'success', message, data)
    }

    static badRequest(message = '', data={}){
        return new ApiResponse(400, 'failure', message, data)
    }
}

module.exports = ApiResponse