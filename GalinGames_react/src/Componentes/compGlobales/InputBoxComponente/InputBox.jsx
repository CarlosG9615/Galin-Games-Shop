import './InputBox.scss';

function InputBox({ ocultarLabel, ...props }){
    console.log(`valores recibidos desde el componente padre: ${JSON.stringify(props)}`);
    return(
        <div className="mb-2">
            <label
                htmlFor={props.nameInput}
                className={`form-label texto-tema${ocultarLabel ? ' visualmente-oculto' : ''}`}>{props.labelInput}
            </label>
            <input
                type={props.typeInput}
                className="form-control"
                id={props.nameInput}
                // placeholder={`Introduce tu ${props.nameInput}...`}
                placeholder={props.placeholderInput}
                value={props.value}
                disabled={props.disabled}
                onChange={props.eventoOnChange} required={props.required !== false} />
        </div>
    )

}
export default InputBox;