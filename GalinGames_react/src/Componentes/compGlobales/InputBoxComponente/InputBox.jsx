function InputBox(props){
    console.log(`valores recibidos desde el componente padre: ${JSON.stringify(props)}`);
    return(
        <div className="mb-3">
            <label 
                htmlFor={props.nameInput} 
                className="form-label videojuego-text">{props.labelInput}
            </label>
            <input 
                type={props.typeInput} 
                className="form-control" 
                id={props.nameInput} 
                // placeholder={`Introduce tu ${props.nameInput}...`}
                placeholder={props.placeholderInput}
                onChange={props.eventoOnChange} required />
        </div>
    )

}
export default InputBox;