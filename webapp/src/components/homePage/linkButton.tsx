import '../../style/homePage/linkbutton.css'

type LinkButtonProps = {
  text: string;      
  href: string;       
  className?: string;
};

export default function LinkButton({ text, href, className = "" }: LinkButtonProps) {
  return (
    <a href={href}>
      <button className={`link-button${className}`}>
        {text}
      </button>
    </a>
  );
}
