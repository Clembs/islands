type ThemeBorder = {
	radius: `${number}%` | number;
	width: number;
	color: string;
};

type ThemeShadow = {
	color: string;
	x: number;
	y: number;
	blur: number;
	spread: number;
};

type GradientBackground = {
	type: 'gradient';
	gradient_colors: string[];
	gradient_direction: number | null;
	gradient_type: 'linear' | 'radial' | 'conic';
};

type ImageBackground = {
	type: 'image';
	image_url: string;
	image_position: 'center' | 'top' | 'bottom' | 'left' | 'right';
	image_size: 'cover' | 'contain';
};

type ColorBackground = {
	type: 'color';
	color: string;
};

export type Theme = {
	background: GradientBackground | ImageBackground | ColorBackground;
	avatar: {
		size: number;
		border: ThemeBorder | null;
	};
	font: {
		family: string;
		color_paragraph: string;
		color_heading: string;
	};
	spacing: {
		padding: number;
		gap: number;
	};
	widgets: {
		color_background: string;
		color_background_dim: string;
		border: ThemeBorder;
		shadow: ThemeShadow | null;
	};
	primary_buttons: {
		color_background: string;
		color_on_background: string;
		border: Omit<ThemeBorder, 'radius' | 'width'>;
		shadow: ThemeShadow | null;
	};
	secondary_inputs: {
		color_background: string;
		color_on_background: string;
		border: ThemeBorder;
		shadow: ThemeShadow | null;
	};
};
